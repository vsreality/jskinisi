# File: tools/sdkgenerator.py
"""Generate deterministic JavaScript codecs and requests for Kinisi API v2."""
import json
from pathlib import Path
import re

TYPES = {'bool':(1,'Uint8'), 'uint8_t':(1,'Uint8'), 'int8_t':(1,'Int8'),
         'uint16_t':(2,'Uint16'), 'int16_t':(2,'Int16'), 'uint32_t':(4,'Uint32'),
         'int32_t':(4,'Int32'), 'uint64_t':(8,'BigUint64'), 'int64_t':(8,'BigInt64'), 'double':(8,'Float64')}
# Additional user commands are generated freely; these support handwritten session behavior.
# Sensor exports are required by the session even when connected firmware is older.
SESSION_COMMANDS = {'PING', 'SET_HEARTBEAT_CONFIG', 'SUBSCRIBE_ODOMETRY',
                    'UNSUBSCRIBE_ODOMETRY', 'ENCODER_ODOMETRY_EVENT', 'PLATFORM_ODOMETRY_EVENT',
                    'GET_TEMPERATURE', 'GET_IMU', 'GET_MOTOR_CURRENT', 'SUBSCRIBE', 'UNSUBSCRIBE', 'TELEMETRY_EVENT'}


def class_name(name):
    """Convert schema object names to the SDK's existing PascalCase convention."""
    return ''.join(word.capitalize() for word in name.split('_'))


def validate_retirement(schema):
    """Reject invalid lifecycle metadata before overwriting generated SDK files."""
    def version(value):
        if isinstance(value, str) and re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)', value):
            return tuple(map(int, value.split('.')))
        return None

    current = version(schema.get('version'))
    commands = {c['command']: c for c in schema.get('commands', [])}
    for name, command in commands.items():
        if 'retired' not in command:
            continue
        retired = command['retired']
        if not isinstance(retired, dict) or set(retired) != {'since', 'replacement', 'removal_major'}:
            raise ValueError(f'{name}: retired must contain since, replacement and removal_major')
        since = version(retired['since'])
        if since is None or current is None or since > current:
            raise ValueError(f'{name}: retired.since must be a protocol version no later than the schema version')
        removal = retired['removal_major']
        if type(removal) is not int or removal > 255 or since is None or removal <= since[0]:
            raise ValueError(f'{name}: retired.removal_major must be a later protocol major (0..255)')
        replacement = retired['replacement']
        target = commands.get(replacement) if isinstance(replacement, str) else None
        if not target or replacement == name or target.get('direction') != command.get('direction') or 'retired' in target:
            raise ValueError(f'{name}: retired.replacement must name an active message with the same direction')


def retirement_notice(command):
    """Expose protocol retirement as the standard editor deprecation annotation."""
    retired = command['retired']
    return (f"Retired since protocol {retired['since']}. Use {retired['replacement']}. "
            f"Kept for compatibility; eligible for removal in protocol {retired['removal_major']}.0.0.")


def generate_js_code(schema, js_version='ES6'):
    """Resolve response references and emit packed little-endian payload codecs."""
    version = schema.get('version')
    if not isinstance(version, str) or not re.fullmatch(r'2\.\d+\.\d+', version):
        raise ValueError('This runtime requires a protocol 2.x.x schema')
    missing = SESSION_COMMANDS - {c.get('command') for c in schema.get('commands', [])}
    if missing:
        raise ValueError('Schema is missing runtime commands: ' + ', '.join(sorted(missing)))
    validate_retirement(schema)
    objects = {o['name']: o for o in schema['objects']}
    topics = schema.get('topics', [])
    ids, names = set(), set()
    for topic in topics:
        code, name = topic.get('id'), topic.get('name')
        if type(code) is not int or not 1 <= code <= 255 or code in ids:
            raise ValueError('Topic IDs must be unique nonzero uint8 values')
        if not isinstance(name, str) or not re.fullmatch(r'[A-Z][A-Z0-9_]*', name) or name in names:
            raise ValueError('Topic names must be unique uppercase identifiers')
        ids.add(code); names.add(name)
        obj = objects.get(topic.get('payload_type'))
        if not obj or any(p['type'] not in TYPES for p in obj['properties']):
            raise ValueError('Topic payload must reference a fixed-size object')
        if sum(TYPES[p['type']][0] for p in obj['properties']) > 249:
            raise ValueError('Topic payload exceeds frame limit')
        if [(p['name'], p['type']) for p in obj['properties'][:3]] != [
                ('timestamp_us', 'uint64_t'), ('clock_mode', 'uint8_t'), ('clock_quality', 'uint8_t')]:
            raise ValueError('Topic payload must start with timestamp and clock metadata')
        for field, low, high in [('index_max', 0, 255), ('min_interval_ms', 2, 3600000)]:
            if type(topic.get(field)) is not int or not low <= topic[field] <= high:
                raise ValueError('Invalid topic ' + field)
    if not {'ENCODER_ODOMETRY', 'PLATFORM_ODOMETRY', 'TEMPERATURE', 'IMU', 'MOTOR_CURRENT'} <= names:
        raise ValueError('Schema is missing runtime topics')
    for command in schema['commands']:
        for prop in command.get('properties', []):
            if 'enum' in prop and (prop['enum'] != 'telemetry_topic' or prop['type'] != 'uint8_t'):
                raise ValueError('Invalid topic enum reference')
    event = next(c for c in schema['commands'] if c['command'] == 'TELEMETRY_EVENT')
    if event.get('topic_payload') != {'discriminator': 'topic_id'} or [
            (p['name'], p['type'], p.get('enum')) for p in event.get('properties', [])] != [
            ('topic_id', 'uint8_t', 'telemetry_topic'), ('index', 'uint8_t', None)]:
        raise ValueError('Invalid telemetry event envelope')
    def size(t):
        return TYPES[t][0] if t in TYPES else sum(size(p['type']) for p in objects[t]['properties'])
    def read(t, offset):
        expr = f'view.get{TYPES[t][1]}({offset}'+(', true' if size(t)>1 else '')+')'
        return f'Boolean({expr})' if t=='bool' else expr
    def write(t, offset, value):
        if t in ('uint64_t','int64_t'):
            value = f'exactBigInt({value})'
        return f'view.set{TYPES[t][1]}({offset}, {value}'+(', true' if size(t)>1 else '')+');'
    lines = ['// Generated from tools/commands.json by tools/sdkgenerator.py. Do not edit.\n',
             'export const SDK_VERSION = Object.freeze([2, 6, 0]);\n',
             f"export const PROTOCOL_VERSION = Object.freeze({json.dumps([int(v) for v in schema['version'].split('.')])});\n"]
    for c in schema['commands']:
        if c.get('direction') not in ('client_to_controller','controller_to_client'):
            raise ValueError('Missing or invalid direction: '+c['command'])
        if 'retired' in c:
            lines.append(f"/** @deprecated {retirement_notice(c)} */\n")
        lines.append(f"export const {c['command']} = {c['code']};\n")
    lines.append('export const ErrorCode = Object.freeze({\n')
    for e in schema['error_codes']:
        lines.append(f"  {e['name']}: {e['code']},\n")
    lines.append('});\nexport const ErrorDescriptions = Object.freeze({\n')
    for e in schema['error_codes']:
        lines.append(f"  {e['code']}: {json.dumps(e['description'])},\n")
    lines.append('''});
/** Preserve uint64/int64 precision instead of silently accepting rounded Numbers. */
function exactBigInt(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new TypeError('64-bit values require a bigint or a safe integer');
  return BigInt(value);
}
/** Decode exactly one payload, respecting typed-array offsets. */
function payloadView(buffer, size) {
  if (!buffer || buffer.byteLength !== size) throw new Error(`Expected ${size} payload bytes, received ${buffer?.byteLength ?? 0}`);
  return ArrayBuffer.isView(buffer)
    ? new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new DataView(buffer);
}
''')
    for o in objects.values():
        cname=class_name(o['name']); props=o['properties']
        lines.append(f'\n/** {o["description"]} */\nexport class {cname} {{\n')
        lines.append('  /** Store one decoded payload. */\n  constructor('+', '.join(p['name'] for p in props)+') {\n')
        for p in props: lines.append(f'    this.{p["name"]} = {p["name"]};\n')
        lines.append(f'  }}\n  /** Packed wire size; independent of JavaScript values. */\n  static getSize() {{ return {size(o["name"])}; }}\n')
        lines.append(f'  /** Encode a payload without a message header. */\n  encode() {{\n    const buffer = new ArrayBuffer({cname}.getSize());\n    const view = new DataView(buffer);\n')
        offset=0
        for p in props:
            lines.append('    '+write(p['type'],offset,'this.'+p['name'])+'\n'); offset+=size(p['type'])
        lines.append('    return buffer;\n  }\n')
        lines.append(f'  /** Decode an exact response payload. uint64 values remain bigint. */\n  static decode(buffer) {{\n    const view = payloadView(buffer, {cname}.getSize());\n    return new {cname}(\n')
        offset=0
        for p in props:
            lines.append('      '+read(p['type'],offset)+',\n'); offset+=size(p['type'])
        lines.append('    );\n  }\n}\n')
    lines.append('\n/** Stable uint8 telemetry topic enum. */\nexport const Topic = Object.freeze({\n')
    for topic in topics:
        lines.append(f"  {topic['name']}: {topic['id']},\n")
    lines.append('});\nexport const TopicDefinitions = Object.freeze({\n')
    for topic in topics:
        lines.append(f"  {topic['id']}: Object.freeze({{ payloadType: {class_name(topic['payload_type'])}, "
                     f"indexMax: {topic['index_max']}, minIntervalMs: {topic['min_interval_ms']} }}),\n")
    lines.append('''});
/** Decode a topic-selected payload. Future unknown topics can be ignored by the session. */
export function decodeTelemetryEvent(payload) {
  const data = ArrayBuffer.isView(payload)
    ? new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength) : new Uint8Array(payload);
  if (data.length < 2) throw new Error('Truncated telemetry envelope');
  const [topic, index] = data;
  const definition = TopicDefinitions[topic];
  if (!definition) return null;
  if (index > definition.indexMax) throw new Error('Invalid telemetry index');
  const sample = definition.payloadType.decode(data.subarray(2));
  if (![0, 1].includes(sample.clock_mode) || ![1, 2].includes(sample.clock_quality) ||
      Object.values(sample).some(value => typeof value === 'number' && !Number.isFinite(value)))
    throw new Error('Invalid telemetry sample');
  if (topic === Topic.MOTOR_CURRENT && sample.amps < 0) throw new Error('Invalid motor current payload');
  return { topic, index, sample };
}
''')
    lines.append('\n/** Generated user commands; session framing belongs to KinisiSession. */\nexport class Commands {\n  /** Implemented by a transport session. */\n  async _request(_command, _payload, _responseLength) { throw new Error("No protocol session"); }\n')
    for c in schema['commands']:
        if c['direction']!='client_to_controller' or c['command'] in ('INIT','TIME_SYNC_RESPONSE'): continue
        props=c.get('properties',[]); n=sum(size(p['type']) for p in props)
        description = f'\n  /** {c["description"]} Errors: '+', '.join(c.get('errors',[]))+'.'
        if 'retired' in c:
            description += f"\n   * @deprecated {retirement_notice(c)}\n   "
        lines.append(description + ' */\n')
        lines.append('  async '+c['command'].lower()+'('+', '.join(p['name'] for p in props)+') {\n')
        for p in props:
            if p.get('enum') == 'telemetry_topic':
                lines.append(f"    if (!Number.isInteger({p['name']}) || !Object.hasOwn(TopicDefinitions, {p['name']})) throw new RangeError('Invalid topic');\n")
        if c['command'] in {'SUBSCRIBE', 'UNSUBSCRIBE'}:
            lines.append("    if (!Number.isInteger(index) || index < 0 || index > TopicDefinitions[topic_id].indexMax) throw new RangeError('Invalid topic index');\n")
        if c['command'] == 'SUBSCRIBE':
            lines.append("    if (!Number.isInteger(interval_ms) || interval_ms < TopicDefinitions[topic_id].minIntervalMs || interval_ms > 3600000) throw new RangeError('Invalid subscription interval');\n")
        if c['command'] in {'GET_TEMPERATURE', 'GET_IMU'}:
            lines.append("    if (!Number.isInteger(sensor_index) || sensor_index < 0 || sensor_index > 255) throw new RangeError('sensor_index must be an integer from 0 to 255');\n")
        if c['command'] == 'GET_MOTOR_CURRENT':
            lines.append("    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');\n")
        if c['command'] in {'INITIALIZE_MOTOR_CONTROLLER', 'START_PLATFORM_CONTROLLER'}:
            # These existing APIs also accept numeric strings from UI controls.
            for name in ('kp', 'ki', 'kd', 'integral_limit'):
                lines.append(f"    if (!['number', 'string'].includes(typeof {name}) || String({name}).trim() === '' || !Number.isFinite(Number({name})) || Number({name}) < 0) throw new RangeError('{name} must be finite and nonnegative');\n")
            lines.append("    if (Number(integral_limit) > 100) throw new RangeError('integral_limit must be 0..100 PWM percentage points');\n")
        if c['command'] in {'INITIALIZE_MOTOR_POSITION_CONTROLLER', 'RESET_MOTOR_POSITION',
                            'SET_MOTOR_POSITION', 'GET_MOTOR_POSITION',
                            'INITIALIZE_PLATFORM_POSITION_CONTROLLER', 'RESET_PLATFORM_POSITION',
                            'SET_PLATFORM_POSITION', 'INITIALIZE_MOTOR_POSITION_PID_CONTROLLER',
                            'INITIALIZE_PLATFORM_POSITION_PID_CONTROLLER'}:
            for p in props:
                name = p['name']
                lines.append(f"    if (typeof {name} !== 'number' || !Number.isFinite({name})) throw new TypeError('{name} must be a finite number');\n")
                if name == 'motor_index':
                    lines.append("    if (!Number.isInteger(motor_index) || motor_index < 0 || motor_index > 3) throw new RangeError('motor_index must be 0..3');\n")
                elif 'kp' in name or 'max_' in name:
                    lines.append(f"    if ({name} <= 0) throw new RangeError('{name} must be positive');\n")
                elif 'tolerance' in name or name.endswith(('ki', 'kd', 'integral_limit')):
                    lines.append(f"    if ({name} < 0) throw new RangeError('{name} must be nonnegative');\n")
        lines.append(f'    const payload = new ArrayBuffer({n});\n')
        if n: lines.append('    const requestView = new DataView(payload);\n')
        offset=0
        for p in props:
            lines.append('    '+write(p['type'],offset,p['name']).replace('view.', 'requestView.')+'\n'); offset+=size(p['type'])
        r=c.get('response')
        if r:
            t=r['name'] if r['type']=='object' else r['type']
            lines.append(f'    const response = await this._request({c["command"]}, payload, {size(t)});\n')
            if c['command'] == 'GET_IMU':
                lines.append(f'    const sample = {class_name(t)}.decode(response);\n')
                lines.append("    if (!Object.values(sample).every(Number.isFinite)) throw new Error('Invalid IMU payload');\n    return sample;\n")
            elif t in objects: lines.append(f'    return {class_name(t)}.decode(response);\n')
            elif c['command'] == 'GET_TEMPERATURE':
                lines.append(f'    const view = payloadView(response, {size(t)});\n    const temperature = {read(t,0)};\n')
                lines.append("    if (!Number.isFinite(temperature)) throw new Error('Invalid temperature payload');\n    return temperature;\n")
            elif c['command'] == 'GET_MOTOR_CURRENT':
                lines.append(f'    const view = payloadView(response, {size(t)});\n    const amps = {read(t,0)};\n')
                lines.append("    if (!Number.isFinite(amps) || amps < 0) throw new Error('Invalid motor current payload');\n    return amps;\n")
            else:
                lines.append(f'    const view = payloadView(response, {size(t)});\n    return {read(t,0)};\n')
        else: lines.append(f'    await this._request({c["command"]}, payload, 0);\n')
        lines.append('  }\n')
    lines.append('}\n')
    return ''.join(lines)


def generate(input_path, output_path, js_version='ES6'):
    """Validate and write a selected schema; preserve reproducible UTF-8 output."""
    schema=json.loads(Path(input_path).read_text(encoding='utf-8'))
    Path(output_path).write_text(generate_js_code(schema, js_version),encoding='utf-8',newline='\n')
