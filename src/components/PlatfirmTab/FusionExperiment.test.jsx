import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FusionExperiment from './FusionExperiment';

const info = { board_model:1, board_major:0, board_minor:4, board_patch:0, protocol_major:2, protocol_minor:19 };
function client() {
  const c = { boardInfo:{...info}, ready:true, mode:0,
    get_fusion_configuration:vi.fn(async()=>({mode:c.mode,mounting_yaw_rad:0})),
    get_fusion_status:vi.fn(async()=>({mode:c.mode,health:0,fault:0,flags:4,sequence:42,
      timestamp_us:2n**60n+7n,accel_age_us:0xffffffff,gyro_age_us:12,encoder_age_us:14})),
    get_fusion_vector:vi.fn(async()=>({sequence:43,x:1,y:2,z:3})),
    set_fusion_experiment:vi.fn(async mode=>{c.mode=mode;}) };
  return c;
}
const click = name => fireEvent.click(screen.getByRole('button',{name}));
describe('fusion experiment panel',()=>{
  it('reads diagnostics without configuration and marks different snapshots',async()=>{
    const c=client();render(<FusionExperiment controller={c} isConnected />);
    await screen.findByText(/Sequence 42/);
    expect(screen.getByText(/Sequence 42/)).toHaveTextContent(String(2n**60n+7n));
    expect(screen.getAllByText(/different snapshot/)).toHaveLength(5);
    expect(screen.getByText(/Unavailable \/ 12/)).toBeInTheDocument();
    expect(c.set_fusion_experiment).not.toHaveBeenCalled();
    expect(screen.getByRole('button',{name:'Enable fusion experiment'})).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Board \+X angle/),{target:{value:'0.5'}});
    fireEvent.click(screen.getByRole('checkbox'));
    click('Enable encoder comparator');
    await waitFor(()=>expect(c.set_fusion_experiment).toHaveBeenCalledExactlyOnceWith(1,.5));
  });
  it('clears stale success on rejection and retries only explicitly',async()=>{
    const c=client();render(<FusionExperiment controller={c} isConnected />);
    await screen.findByText(/Sequence 42/);
    c.set_fusion_experiment.mockRejectedValueOnce(new Error('INVALID_ARGUMENT: targets must be zero'));
    click('Use legacy encoder path');
    expect(await screen.findByRole('alert')).toHaveTextContent('Configuration is not confirmed');
    expect(screen.queryByText(/Sequence 42/)).not.toBeInTheDocument();
    expect(c.set_fusion_experiment).toHaveBeenCalledTimes(1);
    click('Read fusion diagnostics');await screen.findByText(/Sequence 42/);
    expect(c.set_fusion_experiment).toHaveBeenCalledTimes(1);
  });
  it('ignores old replies after reconnect and never reconfigures',async()=>{
    const c=client();let finish;
    c.get_fusion_configuration.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
    const view=render(<FusionExperiment controller={c} isConnected />);
    view.rerender(<FusionExperiment controller={c} isConnected={false} />);
    c.boardInfo={...info};view.rerender(<FusionExperiment controller={c} isConnected />);
    await screen.findByText(/Sequence 42/);
    await act(async()=>finish({mode:2,mounting_yaw_rad:1}));
    expect(screen.getByText(/LEGACY_ENCODER; mounting yaw/)).toBeInTheDocument();
    expect(c.set_fusion_experiment).not.toHaveBeenCalled();
  });
  it('does no I/O for older or unknown boards',()=>{
    const c=client();c.boardInfo.protocol_minor=18;
    const view=render(<FusionExperiment controller={c} isConnected />);
    expect(c.get_fusion_status).not.toHaveBeenCalled();
    c.boardInfo={...info,board_patch:1};view.rerender(<FusionExperiment controller={c} isConnected />);
    expect(c.get_fusion_configuration).not.toHaveBeenCalled();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
