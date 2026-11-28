import differentialDrawing from '../../../docs/img/platform-layouts/differential.svg';
import omniFrontDrawing from '../../../docs/img/platform-layouts/omni-front.svg';
import omniDrawing from '../../../docs/img/platform-layouts/omni.svg';
import mecanumDrawing from '../../../docs/img/platform-layouts/mecanum.svg';

import mirroredDrawing from '../../../docs/img/platform-layouts/mecanum-mirrored.svg';

const presets = {
    differential: {
        name: 'Differential',
        drawing: differentialDrawing,
        wheels: 'W0 is on the left and W1 is on the right. Both roll forward along +X.',
        dimensions: [['B · Wheel base', '0.30 m across the axle, from the center of W0 to the center of W1.']],
    },
    omni: {
        name: 'Omni',
        drawing: omniDrawing,
        wheels: 'W0 is front-right and rolls forward-left. W1 is front-left and rolls rearward-left. W2 is at the rear and rolls right. The wheels roll tangent to the circle. Their rollers allow free motion along each radius.',
        dimensions: [['R · Platform radius', '0.15 m from the chassis origin to each wheel center.']],
    },
    mecanum: {
        name: 'Mecanum',
        drawing: mecanumDrawing,
        wheels: 'W0 is front-right, W1 rear-right, W2 rear-left and W3 front-left. All four wheels roll forward along +X.',
        dimensions: [
            ['L · Platform length', '0.40 m between front and rear wheel centers.'],
            ['W · Platform width', '0.30 m between left and right wheel centers.'],
        ],
    },
};

function PresetExample({ preset, wheels }) {
    const entries = [
        ['D · Wheel diameter', '0.10 m across the rolling surface of each wheel.'],
        ...preset.dimensions,
        ['Encoder resolution', '2048 ticks per full wheel revolution on every encoder.'],
        ['Motor and encoder reversal', 'Leave all boxes clear in this example. Reverse a motor to flip its drive direction. Reverse an encoder separately to flip its count direction.'],
    ];
    return <>
        <p>{wheels} Each W index uses the matching motor M and encoder E channel.</p>
        <h3>Example setup</h3>
        <dl className="platform-layout-fields">
            {entries.map(([field, value]) =>
                <div key={field}><dt>{field}</dt><dd>{value}</dd></div>
            )}
        </dl>
    </>;
}

export default function PlatformLayout({ platformType, mirrored = false, frontWheel = false }) {
    const preset = presets[platformType];
    const mecanum = platformType === 'mecanum';
    const omni = platformType === 'omni';
    const drawing = omni && frontWheel ? omniFrontDrawing : mecanum && mirrored ? mirroredDrawing : preset.drawing;
    const wheels = omni && frontWheel
        ? 'W0 is rear-left and rolls rearward-right. W1 is rear-right and rolls forward-right. W2 is at the front and rolls left. All three roll tangentially for positive counterclockwise yaw.'
        : preset.wheels;
    const pattern = mirrored ? 'Mirrored (O)' : 'Standard (X)';
    return (
        <section className="panel-card platform-layout-reference" aria-labelledby="platform-layout-heading">
            <h2 id="platform-layout-heading">{preset.name} layout</h2>
            <figure>
                <img src={drawing} alt={`${preset.name} chassis from above${mecanum ? `, ${pattern} rollers, front marked` : omni ? `, W2 at the ${frontWheel ? 'front' : 'rear'}, front marked` : ''}, with wheel indices, rolling directions and dimensions.`} />
                <figcaption>O marks the chassis origin. +X points forward, +Y points left, and positive yaw turns counterclockwise.{' '}
                    <a href={drawing} target="_blank" rel="noreferrer">Open full-size drawing in a new tab</a>
                </figcaption>
            </figure>
            {mecanum && <p>Look down at the tops of the tires with the front pointing up. The orange stripes show
                the visible roller axles. On W0 (front right), they slope {mirrored ? 'forward-left' : 'forward-right'}.</p>}
            <PresetExample preset={preset} wheels={wheels} />
        </section>
    );
}
