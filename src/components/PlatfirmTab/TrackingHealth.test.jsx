import {act,render,screen,within} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import TrackingHealth from './TrackingHealth';
import TrackingSource from './TrackingSource';
import {FeedbackSourceHealthFlag as F} from '../../commands/kinisi_commands';

const mark=2n**60n+29n;
const sample=(source,flags=F.PROVENANCE|F.FRESH|F.COMPARISON_AVAILABLE)=>({
  source,health:0,reason:0,detail:0,flags,sequence:42,timestamp_us:mark,age_us:10000,max_age_us:1035000,
});
function controller() {
  return {get_feedback_source_health:vi.fn(async source=>sample(source)),
    get_feedback_imu_channels:vi.fn(async()=>({accel_timestamp_us:mark-2500n,gyro_timestamp_us:mark,accel_age_us:20000,gyro_age_us:17500})),
    set_feedback_source:vi.fn(),set_imu_tracking:vi.fn(),set_platform_target_velocity:vi.fn()};
}
const card=name=>within(screen.getByRole('article',{name}));
afterEach(()=>vi.useRealTimers());
describe('tracking input health',()=>{
  it('retains a direct input fault alongside a separately reported disagreement', async()=>{
    const c = controller();
    c.get_feedback_source_health.mockImplementation(async id => id === 1
      ? {...sample(id,F.PROVENANCE),health:2,reason:3,detail:3}
      : {...sample(id,F.PROVENANCE|F.FRESH|F.COMPARISON_AVAILABLE|F.DISAGREEMENT),health:3});
    render(<TrackingHealth controller={c}/>);
    const summary = within(screen.getByRole('region',{name:'Tracking diagnosis'}));
    expect(await summary.findByText(/Physical IMU input was unavailable/)).toBeVisible();
    expect(summary.getByText('Encoder and IMU motion disagree. The board cannot identify which input caused it.')).toBeVisible();
  });
  it('labels the remaining healthy input and renders both acquisition clocks after IMU failure',async()=>{
    const c=controller();
    c.get_feedback_source_health.mockImplementation(async source=>source===0?sample(0):
      {...sample(source,F.PROVENANCE|F.TIMESTAMP_FAULT|F.RESTART_REQUIRED|F.DISAGREEMENT),health:2,reason:6,detail:5});
    render(<TrackingHealth controller={c}/>);
    await screen.findByText(/Healthy inputs within.*Encoders\./);
    expect(card('Physical IMU').getByText('unavailable')).toBeVisible();
    expect(card('Physical IMU').getByText('Source timestamp fault')).toBeVisible();
    expect(card('Passive fused estimate').getByText('Restart required')).toBeVisible();
    expect(card('Passive fused estimate').getByText('Comparison unavailable')).toBeVisible();
    expect(screen.getByText(`${mark-2500n} µs / 20000 µs`)).toBeVisible();
    expect(screen.getByText(`${mark} µs / 17500 µs`)).toBeVisible();
    expect(c.get_feedback_source_health.mock.calls.map(x=>x[0])).toEqual([0,1,2]);
    expect(c.set_feedback_source).not.toHaveBeenCalled();
    expect(c.set_imu_tracking).not.toHaveBeenCalled();
    expect(c.set_platform_target_velocity).not.toHaveBeenCalled();
  });
  it('shows disagreement without identifying a faulty physical sensor, then recovery without any switch',async()=>{
    vi.useFakeTimers();const c=controller();let recovering=false;
    c.get_feedback_source_health.mockImplementation(async source=>source<2?sample(source):
      {...sample(2,F.PROVENANCE|F.FRESH|(recovering?F.RECOVERING:F.DISAGREEMENT|F.COMPARISON_AVAILABLE)),health:recovering?3:1});
    render(<TrackingHealth controller={c}/>);await act(async()=>{});
    expect(screen.getByText(/Tracking disagreement/)).toBeVisible();
    expect(card('Physical IMU').getByText('healthy')).toBeVisible();
    expect(card('Passive fused estimate').getByText('suspect')).toBeVisible();
    recovering=true;await act(async()=>vi.advanceTimersByTimeAsync(500));
    expect(card('Passive fused estimate').getByText('Recovering')).toBeVisible();
    expect(screen.queryByText(/Tracking disagreement/)).toBeNull();
    expect(c.set_feedback_source).not.toHaveBeenCalled();
  });
  it('expires slow first delivery and recurring unchanged provenance without altering board age',async()=>{
    vi.useFakeTimers();const c=controller();let finish;
    const shortSample = id => ({...sample(id),max_age_us:35000});
    c.get_feedback_source_health.mockImplementation(async id=>shortSample(id));
    c.get_feedback_source_health.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
    render(<TrackingHealth controller={c}/>);await act(async()=>{});
    await act(async()=>vi.advanceTimersByTimeAsync(50));
    expect(card('Physical IMU').getByText(/Historical/)).toBeVisible();
    expect(screen.getByText(/Healthy inputs within.*None confirmed/)).toBeVisible();
    await act(async()=>finish(shortSample(0)));
    expect(card('Encoders').getByText(/Historical/)).toBeVisible();
    expect(card('Encoders').getByText('10000 µs / 35000 µs')).toBeVisible();
    await act(async()=>vi.advanceTimersByTimeAsync(450));
    expect(card('Encoders').getByText(/Historical/)).toBeVisible();
    c.get_feedback_source_health.mockImplementation(async source=>({...shortSample(source),sequence:43,timestamp_us:mark+1n}));
    await act(async()=>vi.advanceTimersByTimeAsync(500));
    expect(card('Encoders').getByText('Within board age limit')).toBeVisible();
    await act(async()=>vi.advanceTimersByTimeAsync(25));
    expect(card('Encoders').getByText(/Historical/)).toBeVisible();
  });
  it('withdraws each healthy input independently while later board reads are pending',async()=>{
    vi.useFakeTimers();
    const c=controller(), seen=new Set();
    c.get_feedback_source_health.mockImplementation(id=>{
      if (seen.has(id)) return new Promise(()=>{});
      seen.add(id);
      return Promise.resolve({...sample(id),max_age_us:id===0?610000:710000});
    });
    render(<TrackingHealth controller={c}/>);await act(async()=>{});
    expect(screen.getByText(/Healthy inputs within.*Encoders, Physical IMU/)).toBeVisible();
    await act(async()=>vi.advanceTimersByTimeAsync(601));
    expect(screen.getByText(/Healthy inputs within.*: Physical IMU/)).toBeVisible();
    await act(async()=>vi.advanceTimersByTimeAsync(100));
    expect(screen.getByText(/Healthy inputs within.*None confirmed/)).toBeVisible();
    expect(card('Encoders').getByText(/Historical/)).toBeVisible();
    expect(card('Physical IMU').getByText(/Historical/)).toBeVisible();
  });
  it('keeps the physical IMU readable when other queries fail and leaves protocol 2.21 compatible',async()=>{
    const c=controller();
    c.get_feedback_source_health.mockImplementation(async source=>{if(source===0)throw Error('No reply');return sample(source);});
    c.get_feedback_imu_channels.mockRejectedValue(new Error('Channel read failed'));
    const view=render(<TrackingHealth controller={c}/>);
    await screen.findByText(/Channel read failed/);
    expect(card('Encoders').getByText(/No reply/)).toBeVisible();
    expect(card('Physical IMU').getByText('healthy')).toBeVisible();
    expect(screen.getByText(/Healthy inputs within.*Physical IMU/)).toBeVisible();
    view.unmount();
    const legacy={ready:true,boardInfo:{board_model:1,board_major:0,board_minor:4,board_patch:0,protocol_major:2,protocol_minor:21},
      readFeedbackSourceSnapshot:vi.fn(async()=>({status:{requested:0,active:255,valid:0,reason:1,age_us:0xffffffff,sequence:0,timestamp_us:0n,origin_id:1,source_detail:0,max_age_ms:300}})),
      get_feedback_source_health:vi.fn(),get_feedback_imu_channels:vi.fn()};
    render(<TrackingSource controller={legacy} isConnected/>);await screen.findByText('not started');
    expect(legacy.get_feedback_source_health).not.toHaveBeenCalled();
    expect(screen.queryByRole('region',{name:'Tracking input health'})).toBeNull();
  });
  it('ignores an outstanding source read after a session reconnect',async()=>{
    const old=controller(), next=controller();let release;
    old.get_feedback_source_health.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));
    const ready={board_model:1,board_major:0,board_minor:4,board_patch:0,protocol_major:2,protocol_minor:22};
    for (const c of [old,next]) Object.assign(c,{ready:true,boardInfo:{...ready},readFeedbackSourceSnapshot:vi.fn(async()=>({
      status:{requested:0,active:255,valid:0,reason:1,age_us:0xffffffff,sequence:0,timestamp_us:0n,origin_id:1,source_detail:0,max_age_ms:300}
    }))});
    next.get_feedback_source_health.mockImplementation(async id=>({...sample(id),sequence:101}));
    const view=render(<TrackingSource controller={old} isConnected/>);
    view.rerender(<TrackingSource controller={old} isConnected={false}/>);
    view.rerender(<TrackingSource controller={next} isConnected/>);
    await card('Encoders').findByText('101');
    await act(async()=>release({...sample(0),health:2}));
    expect(card('Encoders').getByText('101')).toBeVisible();
    expect(old.get_feedback_source_health).toHaveBeenCalledTimes(3);
    expect(next.set_feedback_source).not.toHaveBeenCalled();
  });
  it('reports both input conflicts with encoders selected while passive fusion is stopped',async()=>{
    const c=controller();
    Object.assign(c,{ready:true,boardInfo:{board_model:1,board_major:0,board_minor:4,board_patch:0,protocol_major:2,protocol_minor:22},
      readFeedbackSourceSnapshot:vi.fn(async()=>({status:{requested:0,active:0,valid:1,reason:0,age_us:1000,
        sequence:4,timestamp_us:mark,origin_id:8,source_detail:0,max_age_ms:300},pose:null,twist:null}))});
    c.get_feedback_source_health.mockImplementation(async id=>id===2
      ? {...sample(id,0),health:2,reason:1,timestamp_us:0n,sequence:0,age_us:0xffffffff}
      : {...sample(id,F.PROVENANCE|F.FRESH|F.COMPARISON_AVAILABLE|F.DISAGREEMENT),health:1,timestamp_us:mark+BigInt(id)});
    render(<TrackingSource controller={c} isConnected/>);
    await card('Encoders').findByText('Tracking disagreement');
    expect(card('Physical IMU').getByText('Tracking disagreement')).toBeVisible();
    expect(card('Physical IMU').getByText(`${mark+1n} µs`)).toBeVisible();
    expect(card('Passive fused estimate').getByText('not started')).toBeVisible();
    expect(card('Passive fused estimate').getByText('Comparison unavailable')).toBeVisible();
    expect(screen.queryByText('No disagreement reported')).toBeNull();
    expect(c.set_feedback_source).not.toHaveBeenCalled();
  });
  it('places the board diagnosis before the controls and preserves the limit of the remaining input',async()=>{
    vi.useFakeTimers();
    const c=controller();
    c.get_feedback_source_health.mockImplementation(async id=>id===0
      ? {...sample(0),max_age_us:30000}
      : {...sample(id,F.PROVENANCE),health:2,reason:3,detail:3});
    render(<TrackingHealth controller={c}><button>Source controls</button></TrackingHealth>);
    await act(async()=>{});
    const element=screen.getByRole('region',{name:'Tracking diagnosis'});
    const summary=within(element);
    expect(element.compareDocumentPosition(screen.getByRole('button',{name:'Source controls'})) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(summary.getByText('Physical IMU input was unavailable.')).toBeVisible();
    expect(summary.getByText('Encoder odometry was available at the separate board read.')).toBeVisible();
    expect(summary.getByText(/Healthy inputs within.*Encoders/)).toBeVisible();
    expect(card('Physical IMU').getByText('Input acquisition reason')).toBeVisible();
    expect(card('Passive fused estimate').getByText('Estimate reason')).toBeVisible();
    await act(async()=>vi.advanceTimersByTimeAsync(21));
    expect(summary.getByText(/Healthy inputs within.*None confirmed/)).toBeVisible();
    expect(summary.getByText(/Historical healthy readings: Encoders/)).toBeVisible();
  });

  it('attributes disagreement to its own board read and keeps unmatched later updates separate',async()=>{
    vi.useFakeTimers();
    const c=controller();
    let updated=false, finish;
    c.get_feedback_source_health.mockImplementation(id=>{
      if (id===0 && updated) return new Promise(resolve=>{finish=resolve;});
      if (id===2) return Promise.resolve({...sample(2,0),health:2,reason:1});
      const flags=F.PROVENANCE|F.FRESH|F.COMPARISON_AVAILABLE|(id===0?F.DISAGREEMENT:0);
      return Promise.resolve({...sample(id,flags),max_age_us:35000,health:id===0?3:0});
    });
    render(<TrackingHealth controller={c}/>);
    await act(async()=>{});
    const summary=within(screen.getByRole('region',{name:'Tracking diagnosis'}));
    expect(summary.getByText('Encoder and IMU motion disagree. The board cannot identify which input caused it.')).toBeVisible();
    expect(summary.getByText(/separate board reads gave different comparison results/)).toBeVisible();
    expect(summary.getByText(/sample behind this read is within/)).toBeVisible();
    await act(async()=>vi.advanceTimersByTimeAsync(26));
    expect(summary.getByText(/sample behind this read is now historical/)).toBeVisible();
    updated=true;
    await act(async()=>vi.advanceTimersByTimeAsync(474));
    expect(summary.queryByText(/motion disagree/)).toBeNull();
    expect(summary.getByText(/other input is unconfirmed/)).toBeVisible();
    await act(async()=>finish({...sample(0,F.PROVENANCE|F.TIMESTAMP_FAULT),health:2,reason:6,detail:5}));
    expect(summary.getByText('Encoder input was unavailable.')).toBeVisible();
    expect(summary.getByText('Physical IMU samples were available at the separate board read.')).toBeVisible();
    expect(summary.getByText(/separate one-second tracking window/)).toBeVisible();
    expect(c.set_feedback_source).not.toHaveBeenCalled();
  });

});
