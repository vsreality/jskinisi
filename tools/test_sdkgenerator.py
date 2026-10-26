# File: tools/test_sdkgenerator.py
"""Verify schema compatibility and preserve SDK files when regeneration is rejected."""
from copy import deepcopy
import json
import re
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
        """The current schema produces identical runtime definitions."""
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

    def test_missing_sensor_commands_preserves_output(self):
        """Every sensor export imported by the session is required before writing."""
        with tempfile.TemporaryDirectory() as directory:
            schema_path = Path(directory) / 'commands.json'
            output = Path(directory) / 'commands.js'
            output.write_bytes(b'preserved\n')
            for missing in ({'GET_TEMPERATURE'}, {'GET_IMU'}, {'GET_MOTOR_CURRENT'}, {'GET_TEMPERATURE', 'GET_IMU'}):
                with self.subTest(missing=sorted(missing)):
                    schema = deepcopy(self.schema)
                    schema['commands'] = [c for c in schema['commands'] if c['command'] not in missing]
                    schema_path.write_text(json.dumps(schema), encoding='utf-8')
                    with self.assertRaisesRegex(ValueError, 'missing runtime commands: ' + ', '.join(sorted(missing))):
                        generate(schema_path, output)
                    self.assertEqual(output.read_bytes(), b'preserved\n')

    def test_new_versions_and_commands_are_generated(self):
        """A future v2 schema produces its new public request and protocol version."""
        for version in ('2.6.1', '2.7.0', '2.10.0'):
            schema = deepcopy(self.schema)
            schema['version'] = version
            schema['commands'].append({'command': 'GET_NEW_VALUE', 'code': '0x60',
                'direction': 'client_to_controller', 'description': 'A future command.',
                'response': {'name': 'value', 'type': 'uint16_t', 'direction': 'controller_to_client'}})
            generated = generate_js_code(schema)
            self.assertIn('async get_new_value()', generated)
            self.assertIn('export const GET_NEW_VALUE = 0x60;', generated)
            self.assertIn('PROTOCOL_VERSION = Object.freeze(' + json.dumps(list(map(int, version.split('.')))), generated)

    def test_invalid_topics_and_envelopes(self):
        for field, value in [('id', 0), ('id', True), ('id', 256), ('name', 'bad-name'),
                             ('payload_type', 'missing'), ('payload_type', 'imu_sample'),
                             ('index_max', -1), ('min_interval_ms', 0)]:
            schema = deepcopy(self.schema)
            schema['topics'][0][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                generate_js_code(schema)
        schema = deepcopy(self.schema)
        schema['topics'].append(deepcopy(schema['topics'][0]))
        with self.assertRaises(ValueError):
            generate_js_code(schema)
        schema = deepcopy(self.schema)
        next(c for c in schema['commands'] if c['command'] == 'TELEMETRY_EVENT')['topic_payload'] = {}
        with self.assertRaises(ValueError):
            generate_js_code(schema)

    def test_topic_mapping_is_generated_from_schema(self):
        schema = deepcopy(self.schema)
        schema['topics'].append({'id': 9, 'name': 'AUXILIARY', 'payload_type': 'temperature_sample',
                                 'index_max': 7, 'min_interval_ms': 1000})
        generated = generate_js_code(schema)
        self.assertIn('AUXILIARY: 9', generated)
        self.assertIn('9: Object.freeze({ payloadType: TemperatureSample, indexMax: 7, minIntervalMs: 1000 })', generated)

    def test_retirement_annotations_preserve_callable_commands(self):
        generated = generate_js_code(self.schema)
        self.assertIn('@deprecated Retired since protocol 2.6.0. Use SUBSCRIBE.', generated)
        self.assertIn('eligible for removal in protocol 3.0.0.', generated)
        self.assertRegex(generated, r'@deprecated[^\n]+Use SUBSCRIBE\.[^\n]*\n\s*\*/\n\s*async subscribe_odometry')
        active = deepcopy(self.schema)
        for command in active['commands']:
            command.pop('retired', None)
        strip_comments = lambda code: re.sub(r'\s+', '', re.sub(r'/\*.*?\*/', '', code, flags=re.S))
        self.assertEqual(strip_comments(generated), strip_comments(generate_js_code(active)))

    def test_invalid_retirement_preserves_output(self):
        original = next(c for c in self.schema['commands'] if c['command'] == 'SUBSCRIBE_ODOMETRY')['retired']
        invalid = [None, True, {}, {**original, 'unknown': 1}]
        for field, value in [('since', '2.6'), ('since', '2.8.0'), ('since', True),
                             ('since', '02.6.0'), ('removal_major', 2), ('removal_major', True),
                             ('removal_major', 256), ('replacement', 'MISSING'),
                             ('replacement', 'SUBSCRIBE_ODOMETRY'), ('replacement', 'UNSUBSCRIBE_ODOMETRY'),
                             ('replacement', 'TELEMETRY_EVENT'), ('replacement', [])]:
            invalid.append({**original, field: value})
        with tempfile.TemporaryDirectory() as directory:
            schema_path, output = Path(directory) / 'commands.json', Path(directory) / 'commands.js'
            output.write_bytes(b'preserved\n')
            for retired in invalid:
                schema = deepcopy(self.schema)
                next(c for c in schema['commands'] if c['command'] == 'SUBSCRIBE_ODOMETRY')['retired'] = retired
                schema_path.write_text(json.dumps(schema), encoding='utf-8')
                with self.subTest(retired=retired), self.assertRaises(ValueError):
                    generate(schema_path, output)
                self.assertEqual(output.read_bytes(), b'preserved\n')

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
            source = root / 'old-schema.json'
            for version, missing in (
                ('2.0.0', {'PING'}),
                ('2.5.0', {'GET_TEMPERATURE'}),
                ('2.4.0', {'GET_IMU'}),
                ('2.3.1', {'GET_TEMPERATURE', 'GET_IMU'}),
                ('2.6.0', {'GET_MOTOR_CURRENT'}),
            ):
                with self.subTest(version=version, missing=sorted(missing)):
                    for output in outputs:
                        output.write_bytes(b'preserved\n')
                    schema = deepcopy(self.schema)
                    schema['version'] = version
                    schema['commands'] = [c for c in schema['commands'] if c['command'] not in missing]
                    source.write_text(json.dumps(schema), encoding='utf-8')
                    result = subprocess.run(
                        [sys.executable, '-B', str(root / 'tools/update-commands.py'), '--schema', str(source)],
                        capture_output=True, text=True, timeout=10)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn('missing runtime commands: ' + ', '.join(sorted(missing)), result.stderr)
                    for output in outputs:
                        self.assertEqual(output.read_bytes(), b'preserved\n')


if __name__ == '__main__':
    unittest.main()
