#!/usr/bin/env node

// eslint-disable-next-line
const { App } = require('octokit');

const run = async () => {
    const APP_ID = 370405; // comes from the GitHub App's about page
    const INSTALLATION_ID = 40320420; // comes from the URL after installing the GitHub App to the org
    const OWNER = 'BiblioNexusStudio';
    const REPO = 'aquifer-web';

    const privateKeyBase64 = process.argv[2];
    const environment = process.argv[3];
    const isDestroying = process.argv[4] == 'destroy';
    const sha = process.argv[4];
    const deployedUrl = process.argv[5];
    const isTransient = !!process.argv[6];

    const app = new App({ appId: APP_ID, privateKey: atob(privateKeyBase64) });

    const octokit = await app.getInstallationOctokit(INSTALLATION_ID);

    if (!isDestroying) {
        const {
            data: { id: deploymentId },
        } = await octokit.request('POST /repos/{owner}/{repo}/deployments', {
            owner: OWNER,
            repo: REPO,
            environment,
            transient_environment: isTransient,
            ref: sha,
        });

        await octokit.request('POST /repos/{owner}/{repo}/deployments/{deploymentId}/statuses', {
            deploymentId,
            owner: OWNER,
            repo: REPO,
            state: 'success',
            environment_url: deployedUrl.replace('ENVIRONMENT', environment),
        });
    } else {
        let deployments = await octokit.request('GET /repos/{owner}/{repo}/deployments', {
            owner: OWNER,
            repo: REPO,
            environment,
        });
        deployments = deployments.data.sort((first, second) =>
            second.created_at.localeCompare(first.created_at)
        );
        if (deployments[0]) {
            await octokit.request(
                'POST /repos/{owner}/{repo}/deployments/{deploymentId}/statuses',
                {
                    deploymentId: deployments[0].id,
                    owner: OWNER,
                    repo: REPO,
                    state: 'inactive',
                }
            );
        }
    }
};

run();
