import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const rawPort = process.env.PORT ?? '4005';
  const port = Number.parseInt(rawPort, 10);

  if (Number.isNaN(port)) {
    throw new Error(`Invalid PORT value "${rawPort}".`);
  }

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port,
    url: process.env.APP_URL ?? `http://localhost:${port}`,
  };
});
