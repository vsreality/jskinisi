"""Validate imported profiles and guard deterministic SDK generation."""
from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('profile_updater', ROOT / 'tools/update-board-profiles.py')
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


class ProfileTests(unittest.TestCase):
    def setUp(self):
        self.bundle = json.loads((ROOT / 'tools/board_profiles.json').read_text(encoding='utf-8'))

    def test_shipped_output_matches_all_profiles(self):
        self.assertEqual(updater.generate(self.bundle), (ROOT / 'src/commands/board_profiles.js').read_text(encoding='utf-8'))
        self.assertEqual(len(self.bundle['boards']), 5)

    def test_rejects_incompatible_or_private_profile_data(self):
        for mutate in (
            lambda b: b.update(schema_version=2),
            lambda b: b['boards'].append(deepcopy(b['boards'][0])),
            lambda b: b['boards'][0]['resources'].update(motors=True),
            lambda b: b['boards'][0]['board'].update(build_define='MP_V1'),
            lambda b: b['boards'][0]['sensors']['temperature'].append({'id': 0, 'pin': 'PA8'}),
            lambda b: next(p for p in b['boards'] if p['board']['revision'] == '0.4.0')['sensors']['imu'][0].update(id=1),
            lambda b: b['boards'][3]['motor_features'][0].update(current_limit='yes'),
            lambda b: b['boards'][3].update(power={'driver_sleep': 1}),
            lambda b: b['boards'][3].update(power={'driver_sleep': True, 'sleep_pin': 'PA0'}),
            lambda b: b['boards'][3]['power'].update(board_idle=1),
            lambda b: next(p for p in b['boards'] if 'imu_geometry' in p)['imu_geometry'].update(underside_center_to_imu_um=[0, 1.5, 2]),
        ):
            bundle = deepcopy(self.bundle); mutate(bundle)
            with self.assertRaises(ValueError): updater.generate(bundle)

    def test_generated_profile_tracks_the_mini_intrinsic(self):
        profiles = [board for board in self.bundle['boards'] if 'imu_geometry' in board]
        self.assertEqual([p['board']['revision'] for p in profiles], ['0.4.0'])
        geometry = profiles[0]['imu_geometry']
        self.assertEqual(geometry['underside_center_to_imu_um'], [-15373, 26953, 2075])
        before = updater.generate(self.bundle)
        geometry['underside_center_to_imu_um'][1] = 26954
        after = updater.generate(self.bundle)
        self.assertNotEqual(before, after)
        self.assertIn('26954', after)

    def test_power_capabilities_are_explicit_for_exact_profiles(self):
        self.assertEqual({p['board']['revision']: p['power'] for p in self.bundle['boards']}, {
            '0.1.0': {'driver_sleep': False, 'board_idle': False},
            '0.2.0': {'driver_sleep': False, 'board_idle': False},
            '0.3.0': {'driver_sleep': True, 'board_idle': True},
            '0.3.1': {'driver_sleep': True, 'board_idle': True},
            '0.4.0': {'driver_sleep': True, 'board_idle': True},
        })
        legacy = deepcopy(self.bundle)
        for profile in legacy['boards']: profile.pop('power')
        updater.validate(legacy)  # Older bundles remain readable; no inferred capability.

    def test_failed_import_preserves_both_outputs(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'tools').mkdir(); (root / 'src/commands').mkdir(parents=True)
            shutil.copyfile(ROOT / 'tools/update-board-profiles.py', root / 'tools/update-board-profiles.py')
            outputs = [root / 'tools/board_profiles.json', root / 'src/commands/board_profiles.js']
            for output in outputs: output.write_bytes(b'preserved\n')
            self.bundle['schema_version'] = 2
            source = root / 'invalid.json'; source.write_text(json.dumps(self.bundle))
            result = subprocess.run([sys.executable, str(root / 'tools/update-board-profiles.py'), '--profiles', str(source)], capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            for output in outputs: self.assertEqual(output.read_bytes(), b'preserved\n')


if __name__ == '__main__':
    unittest.main()
