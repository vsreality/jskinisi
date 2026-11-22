import { useContext, useEffect, useRef, useState } from 'react';
import { BoardPowerContext } from '../../contexts/BoardPowerContext';
import { TopicDefinitions, SubscriptionMode, SubscriptionTrigger, SubscriptionDelivery } from '../../commands/kinisi_commands';
import { supportsTopic } from '../../commands/telemetry';

/** Explicit live updates, with cleanup even when a subscription ACK arrives after unmount. */
export default function TelemetryControl({ controller, topic, index = 0, intervalMs = 100, mode = SubscriptionMode.PERIODIC, trigger = SubscriptionTrigger.PERIODIC, maxSilenceMs = 0, onSample }) {
  const power = useContext(BoardPowerContext);
  const monitored = power?.controller === controller && power.idleSupported;
  const powerNow = useRef(null);
  useEffect(() => { powerNow.current = monitored ? power.current : null; }, [monitored, power]);
  const [state, setState] = useState(null);
  const [interval, setIntervalValue] = useState(intervalMs);
  const [selectedMode, setSelectedMode] = useState(mode);
  const [selectedTrigger, setTrigger] = useState(trigger);
  const [silence, setSilence] = useState(maxSilenceMs);
  const configured = controller?.boardInfo?.protocol_major === 2 && controller.boardInfo.protocol_minor >= 12;
  const eventTrigger = configured && selectedTrigger === SubscriptionTrigger.ON_EVENT;
  const supportsModes = controller?.boardInfo?.protocol_major === 2 && controller.boardInfo.protocol_minor >= 9;
  const deliveryMode = supportsModes ? selectedMode : SubscriptionMode.PERIODIC;
  const effectiveSilence = deliveryMode === SubscriptionMode.ON_CHANGE ? silence : 0;
  const quietAllowed = (!configured && deliveryMode === SubscriptionMode.ON_CHANGE) ||
    (configured && !effectiveSilence && (eventTrigger || deliveryMode === SubscriptionMode.ON_CHANGE));
  const connection = controller?.boardInfo;
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
  }, [controller, connection, topic, index]);

  const current = state?.controller === controller && state.connection === connection && state.topic === topic && state.index === index ? state : null;
  useEffect(() => {
    const run = active.current, verified = powerNow.current;
    if (!monitored || !run?.subscription || run.cancelled || run.refreshing ||
        run.subscription.active === false || verified?.idle !== 0 || verified.transition === 'board' ||
        run.requestedEpoch === verified.epoch) return;
    run.requestedEpoch = verified.epoch;
    run.received = false;
    run.refreshing = true;
    clearTimeout(run.timer);
    // Early wake events may have arrived while status was still unverified.
    // Rearm once after verification, retaining the exact stream and handle.
    void run.subscription.refresh().then(() => {
      run.refreshing = false;
      if (active.current === run && !run.cancelled)
        setState({ ...run, status: run.received ? (deliveryMode === SubscriptionMode.ON_CHANGE ? 'Listening for changes' : 'Live') : 'Waiting for samples…' });
    }).catch(error => {
      run.refreshing = false;
      if (active.current === run && !run.cancelled)
        setState({ ...run, status: 'Waiting for samples…', error: `Could not refresh live updates. Stop and start updates to retry. ${error.message}` });
    });
  }, [monitored, power, current, deliveryMode]);
  const start = async () => {
    const run = { controller, connection, topic, index, cancelled: false, subscription: null,
      requestedEpoch: monitored ? power.current?.epoch : undefined };
    active.current = run;
    setState({ ...run, status: 'Starting…' });
    const stale = () => {
      clearTimeout(run.timer);
      run.timer = setTimeout(() => {
        if (active.current !== run || run.cancelled) return;
        const ended = run.subscription?.active === false;
        setState({ ...run, status: ended ? 'Updates ended. Start again to reconnect.' :
          quietAllowed && run.received ? 'Listening for changes' : 'No recent samples' });
        if (!ended) stale();
      }, Math.max((configured && effectiveSilence ? effectiveSilence : interval) * 3, 1500));
    };
    try {
      run.subscription = await controller.subscribe(configured ? {
        topic, index, trigger: selectedTrigger, delivery: deliveryMode === SubscriptionMode.ON_CHANGE ? SubscriptionDelivery.ON_CHANGE : SubscriptionDelivery.ALL,
        pollIntervalMs: eventTrigger ? 0 : interval, maxSilenceMs: deliveryMode === SubscriptionMode.ON_CHANGE ? silence : 0,
      } : { topic, index, intervalMs: interval, mode: deliveryMode }, sample => {
        if (run.cancelled || active.current !== run) return;
        if (monitored && (powerNow.current?.idle !== 0 || powerNow.current.transition === 'board' ||
            run.requestedEpoch !== powerNow.current.epoch)) return;
        run.received = true;
        run.sampleEpoch = powerNow.current?.epoch;
        callback.current(sample);
        setState({ ...run, status: deliveryMode === SubscriptionMode.ON_CHANGE ? 'Listening for changes' : 'Live' });
        stale();
      });
      if (run.cancelled || active.current !== run) { await run.subscription.unsubscribe(); return; }
      setState({ ...run, status: run.received ? (deliveryMode === SubscriptionMode.ON_CHANGE ? 'Listening for changes' : 'Live') : 'Waiting for samples…' });
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
      if (active.current === run && !run.cancelled) setState({ ...run, status: deliveryMode === SubscriptionMode.ON_CHANGE ? 'Listening for changes' : 'Live', error: error.message });
    }
  };

  if (!supportsTopic(controller?.boardInfo, topic, index)) return null;
  const running = current && !current.cancelled && current.subscription?.active !== false &&
    ['Starting…', 'Waiting for samples…', 'Live', 'Listening for changes', 'No recent samples', 'Stopping…'].includes(current.status);
  const paused = monitored && (power.current?.idle !== 0 || power.current?.transition === 'board');
  const status = paused ? (power.current?.idle === 1 && !power.current?.transition
    ? 'Paused by board idle — automatic samples are not live'
    : 'Board state not verified — samples are not live')
    : monitored && running && current.sampleEpoch !== power.current?.epoch
      ? 'Waiting for fresh samples…' : current?.status;
  return <div className="telemetry-control">
    {configured && <label>Trigger
      <select value={selectedTrigger} disabled={!!running} onChange={event => setTrigger(Number(event.target.value))}>
        <option value={SubscriptionTrigger.PERIODIC}>Periodic</option>
        {TopicDefinitions[topic].eventSupported && <option value={SubscriptionTrigger.ON_EVENT}>On event</option>}
      </select>
    </label>}
    {supportsModes && <label>Delivery mode
      <select value={deliveryMode} disabled={!!running} onChange={event => setSelectedMode(Number(event.target.value))}>
        <option value={SubscriptionMode.PERIODIC}>{configured ? 'All' : 'Periodic'}</option>
        <option value={SubscriptionMode.ON_CHANGE}>On change</option>
      </select>
    </label>}
    {!eventTrigger && <label>{configured ? 'Polling interval (ms)' : deliveryMode === SubscriptionMode.ON_CHANGE ? 'Check interval (ms)' : 'Update interval (ms)'}
      <input type="number" min={TopicDefinitions[topic].minIntervalMs} max="3600000" step="1"
        value={interval} disabled={!!running} onChange={event => setIntervalValue(Number(event.target.value))} />
    </label>}
    {configured && deliveryMode === SubscriptionMode.ON_CHANGE && <label>Maximum silence (ms; 0 disables)
      <input type="number" min="0" max="3600000" step="1" value={silence} disabled={!!running}
        onChange={event => setSilence(Number(event.target.value))} />
    </label>}
    <button type="button" className="k-button"
      disabled={current?.status === 'Starting…' || current?.status === 'Stopping…' || (!running && paused)}
      onClick={running ? stop : start}>{running ? 'Stop live updates' : 'Start live updates'}</button>
    {status && <p role="status" aria-label="Live update status">{status}</p>}
    {current?.error && <p className="conn-error" role="alert">{current.error}</p>}
  </div>;
}
