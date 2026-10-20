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
        self.assertEqual(len(self.bundle['boards']), 4)

    def test_rejects_incompatible_or_private_profile_data(self):
        for mutate in (
            lambda b: b.update(schema_version=2),
            lambda b: b['boards'].append(deepcopy(b['boards'][0])),
            lambda b: b['boards'][0]['resources'].update(motors=True),
            lambda b: b['boards'][0]['board'].update(build_define='MP_V1'),
            lambda b: b['boards'][0]['sensors']['temperature'].append({'id': 0, 'pin': 'PA8'}),
            lambda b: b['boards'][3]['sensors']['imu'][0].update(id=1),
            lambda b: b['boards'][3]['motor_features'][0].update(current_limit='yes'),
        ):
            bundle = deepcopy(self.bundle); mutate(bundle)
            with self.assertRaises(ValueError): updater.generate(bundle)

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
