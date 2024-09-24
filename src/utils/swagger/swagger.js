import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        version: '1.0.0',
        title: 'futsal-online-project',
        description: ' 풋살 온라인 api ',
    },
    servers: [
        {
            url: 'http://localhost:3029',
            description: '',
        },
        // { ... }
    ],
    tags: [
        {
            name: '', // Tag name
            description: '', // Tag description
        },
    ],
    schemes: ['http'],
    securityDefinitions: {
        jwt: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization',
        }
    },
};

const outputFile = './swagger-output.json';
const routes = [
    'src/routers/user.router.js',
    'src/routers/team.router.js',
    'src/routers/ranking.router.js',
    'src/routers/player.router.js',
    'src/routers/game.router.js',
    'src/routers/transfer.router.js',
];


swaggerAutogen({ openapi: '3.1.0' })(outputFile, routes, doc);