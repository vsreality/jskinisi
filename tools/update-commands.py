# File: tools/update-commands.py
"""Update the SDK from an explicit local schema or firmware branch."""
import argparse
import json
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import quote
from sdkgenerator import generate_js_code


def main(argv=None):
    """Load and validate before replacing the checked-in schema and generated commands."""
    parser=argparse.ArgumentParser(description=__doc__)
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--schema',type=Path)
    group.add_argument('--branch')
    parser.add_argument('--check', action='store_true', help='Check bundled output without writing')
    args=parser.parse_args(argv)
    if args.schema: raw=args.schema.read_text(encoding='utf-8')
    else:
        url='https://raw.githubusercontent.com/szolotykh/kinisi-motor-controller-firmware/'+quote(args.branch,safe='')+'/commands.json'
        with urlopen(url,timeout=30) as response: raw=response.read().decode('utf-8')
    generated=generate_js_code(json.loads(raw))
    root=Path(__file__).resolve().parents[1]
    output = root/'src/commands/kinisi_commands.js'
    snapshot = root/'tools/commands.json'
    if args.check:
        if not output.exists() or output.read_text(encoding='utf-8') != generated:
            raise ValueError('Bundled commands are stale; run tools/update-commands.py')
        if not snapshot.exists() or json.loads(snapshot.read_text(encoding='utf-8')) != json.loads(raw):
            raise ValueError('Bundled command schema is stale')
    else:
        output.write_text(generated,encoding='utf-8',newline='\n')
        snapshot.write_text(raw,encoding='utf-8',newline='\n')


if __name__=='__main__': main()
