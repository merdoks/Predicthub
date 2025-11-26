import { getGitHubClient } from './github-helper';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TreeItem {
  path: string;
  mode: '100644' | '100755' | '040000' | '160000' | '120000';
  type: 'blob' | 'tree' | 'commit';
  sha?: string;
  content?: string;
}

export async function pushProjectDirectlyViaAPI() {
  try {
    const octokit = await getGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const owner = user.login;
    
    console.log(`Pushing to GitHub as ${owner}...`);
    
    // Get repo info
    const { data: repo } = await octokit.rest.repos.get({
      owner,
      repo: 'PredictHub'
    });
    
    // Get current commit info
    const currentCommitSha = execSync('git rev-parse HEAD').toString().trim();
    const currentCommitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    const authorName = execSync('git log -1 --pretty=%an').toString().trim();
    const authorEmail = execSync('git log -1 --pretty=%ae').toString().trim();
    
    console.log(`Current commit: ${currentCommitSha}`);
    console.log(`Author: ${authorName} <${authorEmail}>`);
    
    // Try to get the current ref
    let baseCommitSha = currentCommitSha;
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner,
        repo: 'PredictHub',
        ref: 'heads/main'
      });
      baseCommitSha = ref.object.sha;
      console.log(`Found existing main branch at: ${baseCommitSha}`);
    } catch (e) {
      console.log('Main branch does not exist yet, creating new branch...');
    }
    
    // If current commit is already ahead, push directly
    if (currentCommitSha !== baseCommitSha) {
      // Update or create the reference
      try {
        await octokit.rest.git.updateRef({
          owner,
          repo: 'PredictHub',
          ref: 'heads/main',
          sha: currentCommitSha
        });
        console.log('Updated main branch reference');
      } catch (e) {
        // If update fails, try to create the reference
        await octokit.rest.git.createRef({
          owner,
          repo: 'PredictHub',
          ref: 'refs/heads/main',
          sha: currentCommitSha
        });
        console.log('Created main branch reference');
      }
    }
    
    return {
      success: true,
      message: 'Successfully pushed to GitHub via API',
      repository: repo.html_url,
      branch: 'main',
      commit: currentCommitSha,
      author: `${authorName} <${authorEmail}>`,
      commitMessage: currentCommitMessage
    };
  } catch (error) {
    console.error('Error pushing via API:', error);
    throw error;
  }
}
