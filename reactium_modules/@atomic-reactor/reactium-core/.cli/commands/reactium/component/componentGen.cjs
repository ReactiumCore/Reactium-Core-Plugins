const { fs, chalk, Reactium } = arcli;
const handlebars = require('handlebars');

const componentGen = async props => {
    const { params, spinner } = props;

    const templateDir = arcli.normalizePath(__dirname, 'template');

    const templates = {
        hooks: {
            file: `reactium-hooks-${params.className}.js`,
            template: 'reactium-hooks.hbs',
            create: params.hooks,
        },
        component: {
            file: `${params.name}.jsx`,
            template: 'index-functional.hbs',
            create: params.index,
        },
        domain: {
            file: `reactium-domain-${params.className}.js`,
            template: 'domain.hbs',
            create: params.domain,
        },
        route: {
            file: `reactium-route-${params.className}.js`,
            template: 'route.hbs',
            create: params.route !== '[]',
        },
        style: {
            file: `${params.styleType}-${params.name}.scss` || '_reactium-style-${params.name}.scss',
            template: 'reactium-style.hbs',
            create: params.style,
        },
    };

    // Create component directory:
    fs.ensureDirSync(params.destination);

    // Create component files:
    for (const item of Object.values(templates)) {
        if (!item.create) continue;

        const filePath = arcli.normalizePath(params.destination, item.file);

        if (fs.existsSync(filePath) && !params.unattended) {
            const { overwrite } = await arcli.props.inquirer.prompt([
                {
                    default: false,
                    type: 'confirm',
                    name: 'overwrite',
                    message: `Overwrite existing ${item.file} file?`,
                    prefix: arcli.prefix,
                    suffix: chalk.magenta(': '),
                },
            ]);
            if (!overwrite) continue;
        }

        if (!item.template) {
            fs.ensureFileSync(filePath);
            continue;
        }

        const templateFilePath = arcli.normalizePath(
            templateDir,
            item.template,
        );

        let fileContent = handlebars.compile(
            fs.readFileSync(templateFilePath, 'utf-8'),
        )(params);

        try {
            await Reactium.Hook.run('arcli-file-gen', fileContent, props);
        } catch (err) {
            spinner.stop();
            console.log(err);
            spinner.start();
        }

        fs.writeFileSync(filePath, fileContent);
    }
};

module.exports = componentGen;
