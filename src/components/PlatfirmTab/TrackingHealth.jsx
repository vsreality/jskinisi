import { useEffect, useState } from 'react';
import {
  FeedbackSource, FeedbackSourceHealthFlag as Flag, FeedbackSourceHealthState as Health,
  FeedbackSourceReason, FusionFault,
} from '../../commands/kinisi_commands';

const sources = [
  [FeedbackSource.ENCODER, 'Encoders'],
  [FeedbackSource.IMU_ONLY, 'Physical IMU'],
  [FeedbackSource.FUSED, 'Passive fused estimate'],
];
const noAge = 0xffffffff;
const age = value => value === noAge ? 'Unavailable' : `${value} µs`;
const stamp = value => value ? `${value} µs` : 'Unavailable';
const label = (catalog, value) => Object.keys(catalog).find(key => catalog[key] === value)
  ?.toLowerCase().replaceAll('_', ' ') ?? `unknown (${value})`;

function HealthCard({ source, title, record }) {
  const sample = record?.sample;
  const flags = sample?.flags ?? 0;
  const past = record?.historical;
  const freshAtRead = Boolean(flags & Flag.FRESH);
  return <article className="tracking-health-card" aria-label={title}>
    <h4>{title}</h4>
    {!sample ? <p>{record?.error ? `Read unavailable. ${record.error}` : 'Reading…'}</p> : <>
      <dl>
        <div><dt>Health at board read</dt><dd>{label(Health, sample.health)}</dd></div>
        <div><dt>{source === FeedbackSource.FUSED ? 'Estimate reason' : 'Input acquisition reason'}</dt><dd>{label(FeedbackSourceReason, sample.reason)}</dd></div>
        {sample.detail !== FusionFault.NONE && <div><dt>Diagnostic</dt><dd>{label(FusionFault, sample.detail)}</dd></div>}
        <div><dt>Motion comparison at read</dt><dd>{flags & Flag.COMPARISON_AVAILABLE ?
          (flags & Flag.DISAGREEMENT ? 'Tracking disagreement' : 'No disagreement reported') : 'Comparison unavailable'}</dd></div>
        <div><dt>Freshness</dt><dd>{freshAtRead ? (past ? 'Historical · fresh at board read' : 'Within board age limit') : 'Not fresh at board read'}</dd></div>
        <div><dt>Age / limit at read</dt><dd>{age(sample.age_us)} / {age(sample.max_age_us)}</dd></div>
        <div><dt>Source timestamp</dt><dd>{flags & Flag.PROVENANCE ? stamp(sample.timestamp_us) : 'Unavailable'}</dd></div>
        <div><dt>Source sequence</dt><dd>{flags & Flag.PROVENANCE ? sample.sequence : 'Unavailable'}</dd></div>
      </dl>
      {Boolean(flags & Flag.RECOVERING) && <p>Recovering</p>}
      {Boolean(flags & Flag.RESTART_REQUIRED) && <p>Restart required</p>}
      {Boolean(flags & Flag.TIMESTAMP_FAULT) && <p>Source timestamp fault</p>}
      {Boolean(flags & Flag.SATURATION) && <p>Sensor saturation</p>}
    </>}
  </article>;
}

const inputs = sources.slice(0, 2);
const inputNames = ['Encoder input', 'Physical IMU input'];
const capabilities = ['Encoder odometry', 'Physical IMU samples'];

function inputDiagnosis(id, sample) {
  if (sample.flags & Flag.RECOVERING) return `${inputNames[id]} is recovering.`;
  if (sample.health === Health.UNAVAILABLE) return `${inputNames[id]} was unavailable.`;
  if (sample.health === Health.SUSPECT) return `The board flagged the ${inputNames[id].toLowerCase()} as suspect.`;
  return `The board could not confirm ${inputNames[id].toLowerCase()} health.`;
}

function summarizeReads(records) {
  const round = Math.max(0, ...sources.map(([id]) => records[id]?.round ?? 0));
  const latest = sources.filter(([id]) => records[id]?.round === round && records[id].sample);
  const compared = latest.filter(([id]) => records[id].sample.flags & Flag.COMPARISON_AVAILABLE);
  const conflict = compared.find(([id]) => records[id].sample.flags & Flag.DISAGREEMENT);
  const physical = latest.filter(([id]) => id !== FeedbackSource.FUSED);
  if (conflict) {
    const mixed = compared.some(([id]) => !(records[id].sample.flags & Flag.DISAGREEMENT));
    const observation = records[conflict[0]];
    const provenance = observation.historical ? 'The sample behind this read is now historical.' :
      (observation.sample.flags & Flag.FRESH) ? 'The sample behind this read is within its board age limit.' : '';
    const directFaults = physical.filter(([id]) => {
      const sample = records[id].sample;
      return sample.reason !== FeedbackSourceReason.OK && (sample.health === Health.SUSPECT || sample.health === Health.UNAVAILABLE);
    });
    return {
      title: 'Encoder and IMU motion disagree. The board cannot identify which input caused it.',
      inputReport: directFaults.map(([id]) => inputDiagnosis(id, records[id].sample)).join(' '),
      note: mixed ? 'The separate board reads gave different comparison results. See each source below.' :
        `The board reported this at the ${conflict[1].toLowerCase()} read.`,
      provenance,
      severity: 'warning',
    };
  }
  const limited = physical.filter(([id]) => records[id].sample.health !== Health.HEALTHY);
  if (limited.length) {
    const observations = limited.map(([id]) => inputDiagnosis(id, records[id].sample));
    const remaining = physical.find(([id]) => records[id].sample.health === Health.HEALTHY && (records[id].sample.flags & Flag.FRESH));
    const note = remaining ? `${capabilities[remaining[0]]} ${remaining[0] === FeedbackSource.ENCODER ? 'was' : 'were'} available at the separate board read.` :
      'Check the individual input reports below.';
    const provenance = remaining?.[0] === FeedbackSource.IMU_ONLY ?
      'IMU-only position has a separate one-second tracking window.' : '';
    return {title: observations.join(' '), note, provenance, severity: 'warning'};
  }
  if (physical.length === inputs.length) return {title: 'Both inputs reported healthy at their separate board reads.'};
  if (physical.length) return {title: `${inputNames[physical[0][0]]} reported healthy. The other input is unconfirmed in this update.`};
  return {title: 'Waiting for an input health report.'};
}

function HealthSummary({ records }) {
  const diagnosis = summarizeReads(records);
  const available = inputs.filter(([id]) => {
    const record = records[id];
    return record?.sample?.health === Health.HEALTHY && (record.sample.flags & Flag.FRESH) && !record.historical;
  });
  const historical = inputs.filter(([id]) => records[id]?.sample?.health === Health.HEALTHY && records[id].historical);
  return <section aria-label="Tracking diagnosis" className={`tracking-diagnosis ${diagnosis.severity ?? ''}`}>
    <h3>Last board diagnosis</h3>
    <p className="tracking-diagnosis-title">{diagnosis.title}</p>
    {diagnosis.inputReport && <p>{diagnosis.inputReport} The board reported input health separately.</p>}
    {diagnosis.note && <p>{diagnosis.note}</p>}
    {diagnosis.provenance && <p>{diagnosis.provenance}</p>}
    <p>Healthy inputs within their board age limits: {available.map(([, title]) => title).join(', ') || 'None confirmed'}.</p>
    {historical.length > 0 && <p>Historical healthy readings: {historical.map(([, title]) => title).join(', ')}.</p>}
  </section>;
}

export default function TrackingHealth({ controller, children }) {
  const [records, setRecords] = useState({});

  useEffect(() => {
    let live = true;
    const pending = new Set(), previous = new Map(), timers = new Map();
    let round = 0;
    async function read(source, readRound) {
      if (pending.has(source)) return;
      pending.add(source);
      const start = performance.now();
      try {
        if (source === 'channels') {
          const channels = await controller.get_feedback_imu_channels();
          if (live) setRecords(old => ({...old, channels, channelError: null}));
        } else {
          const sample = await controller.get_feedback_source_health(source);
          if (!live) return;
          let deadline;
          if (sample.flags & Flag.FRESH) {
            const identity = `${sample.sequence}/${sample.timestamp_us}`;
            const reported = start + (sample.max_age_us - sample.age_us) / 1000;
            const prev = previous.get(source);
            deadline = prev?.identity === identity ? Math.min(prev.deadline, reported) : reported;
            previous.set(source, {identity, deadline});
          }
          clearTimeout(timers.get(source));
          const left = deadline === undefined ? undefined : deadline - performance.now();
          setRecords(old => ({...old, [source]: {sample, round: readRound, historical: left !== undefined && left <= 0}}));
          if (left > 0) {
            timers.set(source, setTimeout(() => {
              if (live) setRecords(old => old[source]?.sample === sample ?
                {...old, [source]: {...old[source], historical: true}} : old);
            }, Math.ceil(left)));
          }
        }
      } catch (e) {
        if (!live) return;
        const error = e.message || 'Board read failed';
        setRecords(old => source === 'channels' ? {...old, channels: null, channelError: error} :
          {...old, [source]: {error, round: readRound}});
      } finally { pending.delete(source); }
    }
    const refresh = () => {
      if (!live || document.hidden) return;
      round++;
      for (const [source] of sources) void read(source, round);
      void read('channels');
    };
    refresh();
    const interval = setInterval(refresh, 500);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      live = false;
      clearInterval(interval);
      for (const timer of timers.values()) clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [controller]);

  const channels = records.channels;
  return <>
    <HealthSummary records={records} />
    {children}
    <section className="tracking-health" aria-label="Tracking input health">
    <h3>Tracking input health</h3>
    <div className="tracking-health-cards">
      {sources.map(([id, title]) => <HealthCard key={id} source={id} title={title} record={records[id]} />)}
    </div>
    <p className="section-help">Physical IMU health describes the BMI088 samples. The one-second IMU-only estimate has its own start and expiry.</p>
    {channels && <dl className="tracking-status" aria-label="IMU acquisition times">
      <div><dt>Accelerometer timestamp / age at read</dt><dd>{stamp(channels.accel_timestamp_us)} / {age(channels.accel_age_us)}</dd></div>
      <div><dt>Gyroscope timestamp / age at read</dt><dd>{stamp(channels.gyro_timestamp_us)} / {age(channels.gyro_age_us)}</dd></div>
    </dl>}
    {records.channelError && <p>IMU channel times unavailable. {records.channelError}</p>}
    </section>
  </>;
}
