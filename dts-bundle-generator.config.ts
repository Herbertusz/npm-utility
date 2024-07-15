// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('./package.json');

const getPackageName = () => {
    return packageJson.name.replace(/^@[^/]+\//g, '');
};

const config = {
    entries: [
        {
            filePath: './src/index.ts',
            outFile: `./dist/types/${getPackageName()}.d.ts`,
            noCheck: false,
        },
    ],
};

module.exports = config;
