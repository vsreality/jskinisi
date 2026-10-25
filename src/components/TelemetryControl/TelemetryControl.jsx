import { useEffect, useRef, useState } from 'react';
import { TopicDefinitions } from '../../commands/kinisi_commands';
import { supportsTopic } from '../../commands/telemetry';

/** Explicit live updates, with cleanup even when a subscription ACK arrives after unmount. */
export default function TelemetryControl({ controller, topic, index = 0, intervalMs = 100, onSample }) {
  const [state, setState] = useState(null);
  const [interval, setIntervalValue] = useState(intervalMs);
  const active = useRef(null), callback = useRef(onSample);
  useEffect(() => { callback.current = onSample; }, [onSample]);
  useEffect(() => () => {
    const run = active.current;
    if (run) {
      run.cancelled = true;
      clearTimeout(run.timer);
      void run.subscription?.unsubscribe().catch(() => {});
      active.current = null;
    }
  }, [controller, topic, index]);

  const current = state?.controller === controller && state.topic === topic && state.index === index ? state : null;
  const start = async () => {
    const run = { controller, topic, index, cancelled: false, subscription: null };
    active.current = run;
    setState({ ...run, status: 'Starting…' });
    const stale = () => {
      clearTimeout(run.timer);
      run.timer = setTimeout(() => {
        if (active.current !== run || run.cancelled) return;
        const ended = run.subscription?.active === false;
        setState({ ...run, status: ended ? 'Updates ended. Start again to reconnect.' : 'No recent samples' });
        if (!ended) stale();
      }, Math.max(interval * 3, 1500));
    };
    try {
      run.subscription = await controller.subscribe({ topic, index, intervalMs: interval }, sample => {
        if (run.cancelled || active.current !== run) return;
        run.received = true;
        callback.current(sample);
        setState({ ...run, status: 'Live' });
        stale();
      });
      if (run.cancelled || active.current !== run) { await run.subscription.unsubscribe(); return; }
      setState({ ...run, status: run.received ? 'Live' : 'Waiting for samples…' });
      stale();
    } catch (error) {
      if (!run.cancelled && active.current === run) {
        active.current = null;
        setState({ ...run, status: '', error: error.message });
      }
    }
  };

  const stop = async () => {
    const run = active.current;
    if (!run?.subscription) return;
    setState({ ...run, status: 'Stopping…' });
    try {
      await run.subscription.unsubscribe();
      run.cancelled = true;
      clearTimeout(run.timer);
      if (active.current === run) {
        active.current = null;
        setState({ ...run, status: 'Updates stopped' });
      }
    } catch (error) {
      if (active.current === run && !run.cancelled) setState({ ...run, status: 'Live', error: error.message });
    }
  };

  if (!supportsTopic(controller?.boardInfo, topic, index)) return null;
  const running = current && !current.cancelled && current.subscription?.active !== false &&
    ['Starting…', 'Waiting for samples…', 'Live', 'No recent samples', 'Stopping…'].includes(current.status);
  return <div className="telemetry-control">
    <label>Update interval (ms)
      <input type="number" min={TopicDefinitions[topic].minIntervalMs} max="3600000" step="1"
        value={interval} disabled={!!running} onChange={event => setIntervalValue(Number(event.target.value))} />
    </label>
    <button type="button" className="k-button"
      disabled={current?.status === 'Starting…' || current?.status === 'Stopping…'}
      onClick={running ? stop : start}>{running ? 'Stop live updates' : 'Start live updates'}</button>
    {current?.status && <p role="status" aria-label="Live update status">{current.status}</p>}
    {current?.error && <p className="conn-error" role="alert">{current.error}</p>}
  </div>;
}
