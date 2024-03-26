import * as path from 'path';
import * as fs from 'fs';
import { SequelizeStorage, Umzug } from 'umzug';
import { fileURLToPath } from 'url';

import { QueryInterface, Sequelize } from 'sequelize';

export function prepareMigrations(sequelize: Sequelize): Umzug<QueryInterface> {
	return new Umzug({
		migrations: {
			glob: path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations', '*.{js,ts,up.sql}'),
			resolve: (params) => {
				const { context, name, path } = params
				if (!path?.endsWith('.sql')) {
					const return_value = Umzug.defaultResolver(params)
					return_value.name = return_value.name.replace(/(\.ts|\.js)$/, '');
					return return_value;
				}
				return {
					name: name.replace('.up.sql', ''),
					up: async () => {
						const sql = fs.readFileSync(path).toString()
						return context.sequelize.query(sql)
					},
					down: async () => {
						// Get the corresponding `.down.sql` file to undo this migration
						const sql = fs
							.readFileSync(path.replace('.up.sql', '.down.sql'))
							.toString()
						return context.sequelize.query(sql)
					},
				}
	
			}
		},
		context: sequelize!.getQueryInterface(),
		storage: new SequelizeStorage({ sequelize }),
		logger: console
	});
}
