const { prefix, chalk } = arcli;
const suffix = chalk.magenta(': ');

module.exports = () => ({
    prefix,
    suffix,
    type: 'fuzzypath',
    name: 'destination',
    itemType: 'directory',
    message: 'Select directory',
    default: 'src/app/components',
    excludeFilter: nodePath => nodePath == '.' || nodePath.startsWith('.'),
    excludePath: nodePath =>
        nodePath.startsWith('build/') || nodePath.startsWith('node_modules'),
});
