import { useContext, useId } from 'react';
import { FaultHistoryContext } from '../../contexts/FaultHistoryContext';
import { FAULT_HISTORY_LIMIT } from '../../contexts/faultHistory';
import { describeMotorFaults } from './motorFaultStatus';
import './FaultHistory.css';

const receivedTime = new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3,
});

export default function FaultHistory({ hideWhenEmpty = false }) {
  const history = useContext(FaultHistoryContext);
  const headingId = useId();
  if (!history || (hideWhenEmpty && !history.entries.length)) return null;
  return <section className="panel-card fault-history" aria-labelledby={headingId}>
    <div className="fault-history-heading">
      <h2 id={headingId}>Fault history</h2>
      <button type="button" className="k-button" disabled={!history.entries.length} onClick={history.clearHistory}>Clear history</button>
    </div>
    <p className="section-help">Last {FAULT_HISTORY_LIMIT} received diagnostic changes across motors, newest first. Times are local receipt times.
      History stays until you clear it or reload this page. Clearing history does not clear driver faults.</p>
    {!history.entries.length ? <p>No history yet. Read faults or start live updates in the motor faults section.</p> :
      <div className="fault-history-scroll" role="region" aria-label="Recorded fault changes" tabIndex={0}>
        <table>
          <thead><tr><th scope="col">Received</th><th scope="col">Connection</th><th scope="col">Motor</th><th scope="col">Status</th><th scope="col">Source</th></tr></thead>
          <tbody>{history.entries.map(entry => <tr key={entry.id}>
            <td><time dateTime={new Date(entry.receivedAt).toISOString()}>{receivedTime.format(entry.receivedAt)}</time></td>
            <td>{entry.connectionNumber}</td>
            <td>{entry.motorIndex}</td>
            <td>{describeMotorFaults(entry.status)}</td>
            <td>{entry.source}</td>
          </tr>)}</tbody>
        </table>
      </div>}
  </section>;
}
