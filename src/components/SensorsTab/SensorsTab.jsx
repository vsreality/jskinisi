import { useContext } from 'react';
import { ControllerContext } from '../../contexts/ControllerContext';
import { supportsTemperatureRead } from '../../commands/temperature';
import BoardTemperature from './BoardTemperature';
import BoardImu from './BoardImu';
import ImuTracking from './ImuTracking';
import { supportsImuRead } from '../../commands/imu';
import { getBoardProfile } from '../../commands/board_profile';
import './SensorsTab.css';
import useImuMount from '../../hooks/useImuMount';

export default function SensorsTab({ isActive = true }) {
  const { controller, isConnected } = useContext(ControllerContext);
  const profile = getBoardProfile(controller?.boardInfo);
  const mounting = useImuMount(controller, isConnected && isActive);
  return <div className="page-layout sensors-page">
    {!isConnected ? <p className="section-help">Connect to a controller to view sensors.</p>
      : !profile ? <section className="panel-card">
        <h2>Sensor availability</h2>
        <p className="section-help">This board is not recognized. Update the client to view its sensors.</p>
      </section> : <>
      {mounting.supported && <p className="section-help">Edit the shared installation under Platform → IMU mounting.
        {' '}<button type="button" className="k-button" disabled={mounting.busy} onClick={()=>mounting.read()}>Read mounting</button>
        {mounting.error && <span role="alert"> {mounting.error}</span>}</p>}
      {profile.capabilities?.imu_tracking && <ImuTracking controller={controller} isConnected={isConnected} isActive={isActive} mounting={mounting}/>}
      {profile.sensors.temperature.map(sensor => supportsTemperatureRead(controller?.boardInfo)
        ? <BoardTemperature key={sensor.id} controller={controller} sensorIndex={sensor.id} isActive={isActive} />
        : <section key={sensor.id} className="panel-card">
          <h2>Board temperature</h2>
          <p className="section-help">Update the board firmware to read temperature.</p>
        </section>)}
      {profile.sensors.imu.map(sensor => supportsImuRead(controller?.boardInfo)
        ? <BoardImu key={sensor.id} controller={controller} sensorIndex={sensor.id} isActive={isActive} />
        : <section key={sensor.id} className="panel-card">
          <h2>Motion sensor (IMU)</h2>
          <p className="section-help">Update the board firmware to read the IMU.</p>
        </section>)}
      {!profile.sensors.temperature.length && !profile.sensors.imu.length &&
        <p className="section-help">This board has no supported sensors.</p>}
    </>}
  </div>;
}
