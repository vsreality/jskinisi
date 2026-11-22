import { useState } from 'react';
import differentialDrawing from '../../../docs/img/platform-layouts/differential.svg';
import omniDrawing from '../../../docs/img/platform-layouts/omni.svg';
import mecanumDrawing from '../../../docs/img/platform-layouts/mecanum.svg';
import customDrawing from '../../../docs/img/platform-layouts/custom.svg';

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
        wheels: 'W0 is front-right, W1 rear-right, W2 rear-left and W3 front-left. All four wheels roll forward along +X. The dashed diagonals show the direction each roller can move freely at ground contact.',
        dimensions: [
            ['L · Platform length', '0.40 m between front and rear wheel centers.'],
            ['W · Platform width', '0.30 m between left and right wheel centers.'],
        ],
    },
};

function PresetExample({ preset }) {
    const entries = [
        ['D · Wheel diameter', '0.10 m across the rolling surface of each wheel.'],
        ...preset.dimensions,
        ['Encoder resolution', '2048 ticks per full wheel revolution on every encoder.'],
        ['Motor and encoder reversal', 'Leave all boxes clear in this example. Reverse a motor to flip its drive direction. Reverse an encoder separately to flip its count direction.'],
    ];
    return <>
        <p>{preset.wheels} Each W index uses the matching motor M and encoder E channel.</p>
        <h3>Example setup</h3>
        <dl className="platform-layout-fields">
            {entries.map(([field, value]) =>
                <div key={field}><dt>{field}</dt><dd>{value}</dd></div>
            )}
        </dl>
    </>;
}

function CustomExample() {
    return <>
        <p>Custom wheel configuration is planned. This read-only example shows how to describe each wheel in the chassis frame.</p>
        <h3>Example wheel entries</h3>
        <dl className="platform-layout-fields">
            <div><dt>W0 and W1 · Driven conventional wheels</dt>
                <dd>W0 is at (0, +0.15) m on M0/E0. W1 is at (0, −0.15) m on M1/E1. Both have a 0.10 m diameter and roll along +X (yaw 0°). Neither has a free roller direction.</dd></div>
            <div><dt>W2 · Passive omni tracking wheel</dt>
                <dd>Place its contact center at (+0.10, +0.05) m, a bearing of 26.6° from +X. Its diameter is 0.06 m. Set rolling yaw to +90° from +X, pointing left (+Y). Its free-motion direction is +90° from rolling, pointing rearward (−X).</dd></div>
            <div><dt>Channels and reversal</dt>
                <dd>W2 has no motor. Encoder E2 counts positive along +Y. All three encoders use 2048 ticks per wheel revolution. Leave encoder reversal off on E0–E2 and motor reversal off on M0 and M1.</dd></div>
        </dl>
    </>;
}

export default function PlatformLayout({ platformType }) {
    const [showCustom, setShowCustom] = useState(false);
    const preset = presets[platformType];
    const name = showCustom ? 'Custom' : preset.name;
    const drawing = showCustom ? customDrawing : preset.drawing;
    return (
        <section className="panel-card platform-layout-reference" aria-labelledby="platform-layout-heading">
            <div className="platform-layout-heading">
                <h2 id="platform-layout-heading">{name} layout</h2>
                <button type="button" className="k-button" aria-pressed={showCustom}
                    aria-controls="platform-layout-content" onClick={() => setShowCustom(!showCustom)}>
                    Custom layout preview
                </button>
            </div>
            <div id="platform-layout-content">
                <figure>
                    <img src={drawing} alt={`${name} chassis from above, with wheel indices, rolling directions and dimensions.`} />
                    <figcaption>O marks the chassis origin. +X points forward, +Y points left, and positive yaw turns counterclockwise.{' '}
                        <a href={drawing} target="_blank" rel="noreferrer">Open full-size drawing in a new tab</a>
                    </figcaption>
                </figure>
                {showCustom ? <CustomExample /> : <PresetExample preset={preset} />}
            </div>
        </section>
    );
}
