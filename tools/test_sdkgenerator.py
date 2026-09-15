# File: tools/test_sdkgenerator.py
"""Verify schema compatibility and preserve SDK files when regeneration is rejected."""
from copy import deepcopy
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

from sdkgenerator import generate, generate_js_code


ROOT = Path(__file__).resolve().parents[1]


class GeneratorTests(unittest.TestCase):
    """Exercise the shipped schema and the same updater used by SDK maintainers."""

    def setUp(self):
        """Load the complete schema rather than a reduced codec fixture."""
        self.schema = json.loads((ROOT / 'tools/commands.json').read_text(encoding='utf-8'))

    def test_current_schema_matches_shipped_code(self):
        """The accepted 2.1 schema still produces identical runtime definitions."""
        actual = (ROOT / 'src/commands/kinisi_commands.js').read_text(encoding='utf-8')
        self.assertEqual(generate_js_code(self.schema), actual)

    def test_incompatible_schema_preserves_output(self):
        """Unsupported framing or absent runtime commands cannot replace the module."""
        with tempfile.TemporaryDirectory() as directory:
            schema_path = Path(directory) / 'commands.json'
            output = Path(directory) / 'commands.js'
            output.write_bytes(b'preserved\n')
            for version in ('1.4.0', '2.0.0', '3.0.0', None):
                schema = deepcopy(self.schema)
                schema['version'] = version
                if version == '2.0.0':
                    schema['commands'] = [c for c in schema['commands'] if c['command'] != 'PING']
                schema_path.write_text(json.dumps(schema), encoding='utf-8')
                with self.subTest(version=version), self.assertRaises(ValueError):
                    generate(schema_path, output)
                self.assertEqual(output.read_bytes(), b'preserved\n')

    def test_new_versions_and_commands_are_generated(self):
        """A future v2 schema produces its new public request and protocol version."""
        for version in ('2.1.1', '2.2.0', '2.10.0'):
            schema = deepcopy(self.schema)
            schema['version'] = version
            schema['commands'].append({'command': 'GET_NEW_VALUE', 'code': '0x60',
                'direction': 'client_to_controller', 'description': 'A future command.',
                'response': {'name': 'value', 'type': 'uint16_t', 'direction': 'controller_to_client'}})
            generated = generate_js_code(schema)
            self.assertIn('async get_new_value()', generated)
            self.assertIn('export const GET_NEW_VALUE = 0x60;', generated)
            self.assertIn('PROTOCOL_VERSION = Object.freeze(' + json.dumps(list(map(int, version.split('.')))), generated)

    def test_updater_preserves_schema_and_module(self):
        """A rejected local update leaves both checked-in artifacts untouched."""
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'tools').mkdir()
            (root / 'src/commands').mkdir(parents=True)
            for name in ('update-commands.py', 'sdkgenerator.py'):
                shutil.copyfile(ROOT / 'tools' / name, root / 'tools' / name)
            outputs = [root / 'tools/commands.json', root / 'src/commands/kinisi_commands.js']
            for output in outputs:
                output.write_bytes(b'preserved\n')
            self.schema['version'] = '2.0.0'
            self.schema['commands'] = [c for c in self.schema['commands'] if c['command'] != 'PING']
            source = root / 'old-schema.json'
            source.write_text(json.dumps(self.schema), encoding='utf-8')
            result = subprocess.run(
                [sys.executable, '-B', str(root / 'tools/update-commands.py'), '--schema', str(source)],
                capture_output=True, text=True, timeout=10)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('missing runtime commands: PING', result.stderr)
            for output in outputs:
                self.assertEqual(output.read_bytes(), b'preserved\n')


if __name__ == '__main__':
    unittest.main()
