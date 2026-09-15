# File: tools/sdkgenerator.py
"""Generate deterministic JavaScript codecs and requests for Kinisi API v2."""
import json
from pathlib import Path
import re

TYPES = {'bool':(1,'Uint8'), 'uint8_t':(1,'Uint8'), 'int8_t':(1,'Int8'),
         'uint16_t':(2,'Uint16'), 'int16_t':(2,'Int16'), 'uint32_t':(4,'Uint32'),
         'int32_t':(4,'Int32'), 'uint64_t':(8,'BigUint64'), 'int64_t':(8,'BigInt64'), 'double':(8,'Float64')}
# Additional user commands are generated freely; these support handwritten session behavior.
SESSION_COMMANDS = {'PING', 'SET_HEARTBEAT_CONFIG', 'SUBSCRIBE_ODOMETRY',
                    'UNSUBSCRIBE_ODOMETRY', 'ENCODER_ODOMETRY_EVENT', 'PLATFORM_ODOMETRY_EVENT'}


def class_name(name):
    """Convert schema object names to the SDK's existing PascalCase convention."""
    return ''.join(word.capitalize() for word in name.split('_'))


def generate_js_code(schema, js_version='ES6'):
    """Resolve response references and emit packed little-endian payload codecs."""
    version = schema.get('version')
    if not isinstance(version, str) or not re.fullmatch(r'2\.\d+\.\d+', version):
        raise ValueError('This runtime requires a protocol 2.x.x schema')
    missing = SESSION_COMMANDS - {c.get('command') for c in schema.get('commands', [])}
    if missing:
        raise ValueError('Schema is missing runtime commands: ' + ', '.join(sorted(missing)))
    objects = {o['name']: o for o in schema['objects']}
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
             'export const SDK_VERSION = Object.freeze([2, 1, 0]);\n',
             f"export const PROTOCOL_VERSION = Object.freeze({json.dumps([int(v) for v in schema['version'].split('.')])});\n"]
    for c in schema['commands']:
        if c.get('direction') not in ('client_to_controller','controller_to_client'):
            raise ValueError('Missing or invalid direction: '+c['command'])
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
    lines.append('\n/** Generated user commands; session framing belongs to KinisiSession. */\nexport class Commands {\n  /** Implemented by a transport session. */\n  async _request(_command, _payload, _responseLength) { throw new Error("No protocol session"); }\n')
    for c in schema['commands']:
        if c['direction']!='client_to_controller' or c['command'] in ('INIT','TIME_SYNC_RESPONSE'): continue
        props=c.get('properties',[]); n=sum(size(p['type']) for p in props)
        lines.append(f'\n  /** {c["description"]} Errors: '+', '.join(c.get('errors',[]))+'. */\n')
        lines.append('  async '+c['command'].lower()+'('+', '.join(p['name'] for p in props)+') {\n')
        lines.append(f'    const payload = new ArrayBuffer({n});\n')
        if n: lines.append('    const requestView = new DataView(payload);\n')
        offset=0
        for p in props:
            lines.append('    '+write(p['type'],offset,p['name']).replace('view.', 'requestView.')+'\n'); offset+=size(p['type'])
        r=c.get('response')
        if r:
            t=r['name'] if r['type']=='object' else r['type']
            lines.append(f'    const response = await this._request({c["command"]}, payload, {size(t)});\n')
            if t in objects: lines.append(f'    return {class_name(t)}.decode(response);\n')
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
