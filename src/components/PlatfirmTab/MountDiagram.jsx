import { useId } from 'react';

// Manufacturing XY in millimetres: +X away from USB, +Y toward the U601 long edge.
// The chip, rather than the center of the board outline, is the rotation pivot.
const chip = [25.14, -6.06];
const outline = [[0, 0], [81.025, 0], [81.025, -66.025], [0, -66.025]];
const parts = [
  { center: [5.5025, -13.5], size: [8, 9], fill: '#c9d5db' },
  { center: [46.6, -20.545], size: [14, 14], fill: '#263d43' },
  { center: chip, size: [3, 4.5], fill: '#ffbe55' },
];
const axisColors = ['#b63d24', '#14724e', '#315cb6'];
function rotate([x, y, z], [r, p, h]) {
  const ry = Math.cos(r) * y - Math.sin(r) * z, rz = Math.sin(r) * y + Math.cos(r) * z;
  const px = Math.cos(p) * x + Math.sin(p) * rz, pz = -Math.sin(p) * x + Math.cos(p) * rz;
  return [Math.cos(h) * px - Math.sin(h) * ry, Math.sin(h) * px + Math.cos(h) * ry, pz];
}
function box([x,y], [w,h]) {
  return [[x-w/2,y-h/2], [x+w/2,y-h/2], [x+w/2,y+h/2], [x-w/2,y+h/2]];
}
function Board({ project, showParts = true }) {
  const shape = points => points.map(([x,y]) => project([x-chip[0], y-chip[1], 0]).join(',')).join(' ');
  return <>
    <polygon points={shape(outline)} fill="#387364" stroke="#234d43" strokeWidth="2" strokeLinejoin="round"/>
    {showParts && parts.map(({center,size,fill}) => <polygon key={center[0]} points={shape(box(center,size))} fill={fill} stroke="#263c3e" strokeWidth="1"/>)}
  </>;
}

function platformLayout(platform) {
  const valid = value => Number.isFinite(value) && value > 0;
  const mm = metres => metres * 1000;
  if (valid(platform?.diameter)) {
    const diameter = mm(platform.diameter);
    if (platform.type === 'differential' && valid(platform.track)) {
      const half = mm(platform.track)/2;
      return { name:'Differential', halfWidth:half, halfLength:half*.85, diameter, wheels:[[-half,0,0],[half,0,0]] };
    }
    if (platform.type === 'omni' && valid(platform.radius)) {
      const r = mm(platform.radius);
      return { name:'Omni', halfWidth:r, halfLength:r, diameter,
        wheels:[[r*Math.sqrt(3)/2,-r/2,-30],[-r*Math.sqrt(3)/2,-r/2,30],[0,r,90]] };
    }
    if (platform.type === 'mecanum' && valid(platform.length) && valid(platform.width)) {
      const l=mm(platform.length)/2,w=mm(platform.width)/2;
      return { name:'Mecanum', halfWidth:w, halfLength:l+diameter*.3, diameter, wheels:[[w,-l,0],[w,l,0],[-w,l,0],[-w,-l,0]] };
    }
  }
  return { name:'Generic chassis · unconfigured or custom', halfWidth:100, halfLength:120, diameter:0, wheels:[] };
}

export default function MountDiagram({ values, platform }) {
  const id = useId();
  const angles = values.slice(0,3).map(n => Number(n) * Math.PI / 180);
  const [x,y,z] = values.slice(3).map(n => Number(n)*1000);
  const layout = platformLayout(platform);
  const { halfWidth, halfLength, diameter, wheels } = layout;
  // The farthest physical PCB corner is 82.1 mm from U601. Fit every
  // projected board corner as well as the chip and chassis in each view.
  const boardReach = 83;
  const scale = Math.min(.8, 94/(halfWidth+diameter*.5), 92/(halfLength+diameter*.5),
    94/(Math.abs(y)+boardReach), 94/(Math.abs(x)+boardReach));
  const rearScale = Math.min(scale, 28/(Math.abs(z)+boardReach), 28/Math.max(1,diameter*.3));
  const origin = [147,150];
  const plan = ([dx,dy]) => [origin[0]-(y+dy)*scale, origin[1]-(x+dx)*scale];
  const [cx,cy] = plan([0,0]);
  const boardPlan = point => plan(rotate(point,angles));
  // The elevated oblique view shows both the board face and side-mounted geometry.
  const oblique = ([a,b,c]) => [a*.58-b*.82, -a*.38-b*.27-c*.88];
  const iso = point => {
    const a = oblique(rotate(point,angles));
    return [438+1.45*a[0],157+1.45*a[1]];
  };
  const normals = rotate([0,0,1],angles);
  const faceVisible = normals[0]*.72+normals[1]*.51-normals[2]*.47 < 0;
  const usb = iso([parts[0].center[0]-chip[0],parts[0].center[1]-chip[1],0]);
  return <figure className="mount-diagram">
    <svg viewBox="0 0 590 332" role="img" aria-labelledby={id}>
      <title id={id}>Robot top and rear views with chassis origin and chip offset, and an enlarged oriented Kinisi Mini board</title>
      <rect width="590" height="332" rx="10" fill="#f4f8f9"/>
      <g className="mount-view-caption"><text x="16" y="24">ROBOT · TOP</text><text x="316" y="24">BOARD ORIENTATION</text></g>
      <path d="M294 12v306" stroke="#cbd9dd"/>
      <g transform={`translate(${origin[0]} ${origin[1]}) scale(${scale})`}>
        {layout.name === 'Omni' ? <circle r={halfWidth*.94} fill="#d9e4e8" stroke="#586e79" strokeWidth="3"/> :
          <rect x={-halfWidth*.93} y={-halfLength} width={halfWidth*1.86} height={halfLength*2} rx={halfWidth*.23} fill="#d9e4e8" stroke="#586e79" strokeWidth="3"/>}
        {wheels.map(([wx,wy,angle],i)=><g key={i} aria-label={`Wheel ${i}`} transform={`translate(${wx} ${wy}) rotate(${angle})`}>
          <rect x={-diameter*.14} y={-diameter/2} width={diameter*.28} height={diameter} rx={diameter*.075} fill="#435664"/>
          {layout.name==='Mecanum' && [-.25,0,.25].map(pos=><path key={pos} d={`M${-diameter*.12} ${pos*diameter} l${diameter*.24} ${diameter*([0,2].includes(i) ? .16 : -.16)}`} stroke="#abbcc5" strokeWidth="3"/>)}
        </g>)}
        <path d={`M-15 ${-halfLength*.65} l15 -12 15 12`} fill="none" stroke="#647c88" strokeWidth="4"/>
      </g>
      <text x="147" y="47" textAnchor="middle">Front +X ↑</text>
      <text x="15" y="146" className="mount-annotation">+Y left</text>
      <Board project={boardPlan} showParts={normals[2] >= 0}/>
      <path d={`M${origin.join(' ')} L${cx} ${cy}`} stroke="#ab6815" strokeWidth="2" strokeDasharray="3 3"/>
      <circle cx={cx} cy={cy} r="5" fill="#f7ad37" stroke="#714912" strokeWidth="1.5"/>
      <g transform={`translate(${origin.join(' ')})`} fill="none" stroke="#142731" strokeWidth="1.5"><circle r="8"/><path d="M-12 0h7m10 0h7M0 -12v7m0 10v7"/></g>
      <text x="16" y="255" className="mount-view-caption">REAR VIEW · LOOKING FORWARD</text>
      <g aria-label="Rear-view geometry" transform="translate(147 294)">
        <rect x={-halfWidth*.93*rearScale} y={-7*rearScale} width={halfWidth*1.86*rearScale} height={14*rearScale} rx="3" fill="#d0dce0" stroke="#687e89"/>
        {Array.from(new Set(wheels.map(w=>w[0]))).map(wx=><rect key={wx} x={(wx-diameter*.12)*rearScale} y={-diameter*.2*rearScale} width={diameter*.24*rearScale} height={diameter*.5*rearScale} rx="3" fill="#435664"/>)}
        <Board project={point=>{const [,b,c]=rotate(point,angles);return [-(y+b)*rearScale,-(z+c)*rearScale];}} showParts={false}/>
        <circle r="5" fill="none" stroke="#142731"/><circle cx={-y*rearScale} cy={-z*rearScale} r="3.5" fill="#f7ad37" stroke="#714912"/>
      </g>
      <text x="16" y="293" className="mount-annotation">+Z up ↑</text>
      <Board project={iso} showParts={faceVisible}/>
      <g fill="none" stroke="#536976" strokeWidth="1.3">
        <path d={`M${usb.join(' ')} L350 214 H319`} />
        <path d="M438 157 L500 202 H564"/>
      </g>
      <circle cx="438" cy="157" r="4.5" fill="#ffbe55" stroke="#714912"/>
      <text x="319" y="229">J501 · USB-C</text>
      <text x="565" y="218" textAnchor="end">U601 · BMI088</text>
      {['X','Y','Z'].map((name,i)=>{
        const start=iso([0,0,0]);
        const vector=[0,0,0];vector[i]=32;
        const end=iso(vector);
        return <g key={name} stroke={axisColors[i]} strokeWidth="2"><line x1={start[0]} y1={start[1]} x2={end[0]} y2={end[1]}/>
          <circle cx={end[0]} cy={end[1]} r="8" fill="white"/><text x={end[0]} y={end[1]+3.5} textAnchor="middle" fill={axisColors[i]} stroke="none">{name}</text></g>;
      })}
      <text x="316" y="272" className="mount-view-caption">BOARD AXES</text>
      <text x="316" y="293">X away from USB-C · Y toward the IMU edge</text>
      <text x="316" y="312">Z out of the component face</text>
    </svg>
    <figcaption><span className="mount-key-origin"/> Tracking origin <span className="mount-key-chip"/> IMU chip <span>{layout.name} · board detail enlarged</span></figcaption>
  </figure>;
}
