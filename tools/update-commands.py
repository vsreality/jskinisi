# File: tools/update-commands.py
"""Update the SDK from an explicit local schema or firmware branch."""
import argparse
import json
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import quote
from sdkgenerator import generate_js_code


def main():
    """Load and validate before replacing the checked-in schema and generated commands."""
    parser=argparse.ArgumentParser(description=__doc__)
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--schema',type=Path)
    group.add_argument('--branch')
    args=parser.parse_args()
    if args.schema: raw=args.schema.read_text(encoding='utf-8')
    else:
        url='https://raw.githubusercontent.com/szolotykh/kinisi-motor-controller-firmware/'+quote(args.branch,safe='')+'/commands.json'
        with urlopen(url,timeout=30) as response: raw=response.read().decode('utf-8')
    generated=generate_js_code(json.loads(raw))
    root=Path(__file__).resolve().parents[1]
    (root/'src/commands/kinisi_commands.js').write_text(generated,encoding='utf-8',newline='\n')
    (root/'tools/commands.json').write_text(raw,encoding='utf-8',newline='\n')


if __name__=='__main__': main()
