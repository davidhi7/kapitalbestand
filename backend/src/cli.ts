import { ParseArgsConfig, parseArgs } from 'util';

const parseArgsOptions: ParseArgsConfig = {
    options: {
        'orm-logging': {
            type: 'boolean',
            default: false
        },
        migrate: {
            type: 'boolean',
            default: false
        }
    }
};

export function parseCli() {
    return parseArgs(parseArgsOptions).values;
}
