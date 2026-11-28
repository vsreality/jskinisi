import differentialDrawing from '../../../docs/img/platform-layouts/differential.svg';
import omniFrontDrawing from '../../../docs/img/platform-layouts/omni-front.svg';
import omniDrawing from '../../../docs/img/platform-layouts/omni.svg';
import mecanumDrawing from '../../../docs/img/platform-layouts/mecanum.svg';
import mirroredDrawing from '../../../docs/img/platform-layouts/mecanum-mirrored.svg';

const presets = {
    differential: {
        name: 'Differential',
        drawing: differentialDrawing,
        description: 'W0 left and W1 right, both rolling forward. Measure wheel base between their centers.',
    },
    omni: {
        name: 'Omni',
        drawing: omniDrawing,
        alternate: omniFrontDrawing,
        description: 'W2 at the rear rolls right. W0 front-right rolls forward-left and W1 front-left rolls rearward-left.',
        alternateDescription: 'W2 at the front rolls left. W0 rear-left rolls rearward-right and W1 rear-right rolls forward-right.',
        measurement: 'Measure radius from the chassis center to a wheel center.',
    },
    mecanum: {
        name: 'Mecanum',
        drawing: mecanumDrawing,
        alternate: mirroredDrawing,
        description: 'Standard (X) rollers. The visible axles on W0 slope forward-right.',
        alternateDescription: 'Mirrored (O) rollers. The visible axles on W0 slope forward-left.',
        measurement: 'W0 front-right, W1 rear-right, W2 rear-left and W3 front-left all roll forward. Measure length and width between wheel centers.',
    },
};

export default function PlatformLayout({ platformType, mirrored = false, frontWheel = false }) {
    const preset = presets[platformType];
    const alternate = (platformType === 'omni' && frontWheel) || (platformType === 'mecanum' && mirrored);
    const drawing = alternate ? preset.alternate : preset.drawing;
    const description = alternate ? preset.alternateDescription : preset.description;
    const alt = [
        `${preset.name} chassis from above. ${description}`,
        preset.measurement,
        'Measure diameter across the tread. +X forward, +Y left, positive yaw counterclockwise.',
    ].filter(Boolean).join(' ');
    return (
        <section className="panel-card platform-layout-reference" aria-label={`${preset.name} layout`}>
            <figure>
                <img src={drawing} alt={alt} />
                <figcaption>
                    <span>W0 uses M0 and E0. Match numbers for every wheel.</span>
                    <div className="platform-layout-links">
                        <a href={drawing} target="_blank" rel="noreferrer">Full-size diagram</a>
                        <a href="https://vsreality.com/docs/kinisi-motor-controller/tutorials/first-drive/" target="_blank" rel="noreferrer">First-drive guide</a>
                    </div>
                </figcaption>
            </figure>
        </section>
    );
}
