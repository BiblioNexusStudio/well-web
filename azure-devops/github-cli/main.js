#!/usr/bin/env node

/* eslint-disable */
const { App } = require('octokit');
const semver = require('semver');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
/* eslint-enable */

const APP_ID = 370405; // comes from the GitHub App's about page
const INSTALLATION_ID = 40320420; // comes from the URL after installing the GitHub App to the org
const OWNER = 'BiblioNexusStudio';
const REPO = 'aquifer-web';

const createOctokit = async (privateKey) =>
    await new App({ appId: APP_ID, privateKey }).getInstallationOctokit(INSTALLATION_ID);

const release = async (argv) => {
    const { privateKeyBase64, ref } = argv;

    const octokit = await createOctokit(atob(privateKeyBase64));

    const { data: releases } = await octokit.request('GET /repos/{owner}/{repo}/releases', {
        owner: OWNER,
        repo: REPO,
    });

    const versions = releases.map((release) => release.tag_name).filter(semver.valid);
    const latestReleaseVersion = versions.sort(semver.rcompare)[0];

    const newVersion = semver.inc(latestReleaseVersion, 'patch');

    await octokit.request('POST /repos/{owner}/{repo}/releases', {
        owner: OWNER,
        repo: REPO,
        tag_name: `v${newVersion}`,
        target_commitish: ref,
        generate_release_notes: true,
    });
};

const deployment = async (argv) => {
    const { privateKeyBase64, environment, destroy, ref, deployedUrl, previewEnvName } = argv;
    const isTransient = !!previewEnvName;

    const octokit = await createOctokit(atob(privateKeyBase64));

    if (!destroy) {
        const {
            data: { id: deploymentId },
        } = await octokit.request('POST /repos/{owner}/{repo}/deployments', {
            owner: OWNER,
            repo: REPO,
            environment,
            transient_environment: isTransient,
            required_contexts: [],
            auto_merge: false,
            ref,
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

yargs(hideBin(process.argv))
    .command(
        'deployment',
        'Create a deployment in GitHub',
        (yargs) => {
            return yargs
                .option('privateKeyBase64', {
                    type: 'string',
                    description: 'GitHub App Private Key in base64',
                    requiresArg: true,
                })
                .option('environment', {
                    type: 'string',
                    description: 'Environment',
                    requiresArg: true,
                })
                .option('destroy', {
                    type: 'boolean',
                    description: 'Should deployment be destroyed?',
                })
                .option('ref', {
                    type: 'string',
                    description: 'Commit Ref',
                })
                .option('deployedUrl', {
                    type: 'string',
                    description: 'Deployed URL',
                })
                .option('previewEnvName', {
                    type: 'string',
                    description: 'Preview Env Name',
                });
        },
        deployment
    )
    .command(
        'release',
        'Create a new GitHub release by incrementing the last tag patch version',
        (yargs) => {
            return yargs
                .option('privateKeyBase64', {
                    type: 'string',
                    description: 'GitHub App Private Key in base64',
                    requiresArg: true,
                })
                .option('ref', {
                    type: 'string',
                    description: 'Commit Ref',
                    requiresArg: true,
                });
        },
        release
    )
    .demandCommand(1, 'You need at least one command before moving on')
    .help().argv;
