import { getGitHubClient } from './github-helper';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const IGNORE_PATHS = ['node_modules', '.git', '.cache', 'attached_assets', '.upm', 'dist', 'build'];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATHS.some(ignore => filePath.includes(ignore));
}

export async function pushAllFilesToGitHub() {
  try {
    const octokit = await getGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const owner = user.login;
    const repo = 'PredictHub';
    
    console.log(`Uploading to GitHub as ${owner}...`);
    
    // Get repo
    await octokit.rest.repos.get({ owner, repo });
    
    // Get all git tracked files
    const gitFilesOutput = execSync('git ls-files', { 
      encoding: 'utf-8',
      cwd: '/home/runner/workspace'
    });
    
    const trackedFiles = gitFilesOutput
      .trim()
      .split('\n')
      .filter(f => f && !shouldIgnore(f));
    
    console.log(`Found ${trackedFiles.length} files to upload`);
    
    // Create tree items directly without creating blobs first
    // This allows the API to handle blob creation automatically
    const treeItems: any[] = [];
    
    for (const filePath of trackedFiles) {
      try {
        const fullPath = path.join('/home/runner/workspace', filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Add directly to tree - let API handle blob creation
        treeItems.push({
          path: filePath,
          mode: '100644',
          type: 'blob',
          content: content
        });
      } catch (e) {
        console.log(`Skipped: ${filePath}`);
      }
    }
    
    if (treeItems.length === 0) {
      throw new Error('No files to upload');
    }
    
    console.log(`Creating tree with ${treeItems.length} files...`);
    
    // Create tree with base tree to get existing structure
    let baseTree = undefined;
    try {
      // Get latest commit from main
      const { data: ref } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: 'heads/main'
      });
      
      const { data: commit } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: ref.object.sha
      });
      
      baseTree = commit.tree.sha;
      console.log(`Using base tree: ${baseTree}`);
    } catch (e) {
      console.log('No existing main branch, starting fresh');
    }
    
    // Create tree
    const { data: tree } = await octokit.rest.git.createTree({
      owner,
      repo,
      tree: treeItems,
      base_tree: baseTree
    });
    
    console.log(`Created tree: ${tree.sha}`);
    
    // Create commit
    const { data: commit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      tree: tree.sha,
      message: 'Initial commit: PredictHub - AI-powered prediction market platform',
      author: {
        name: 'merdoks',
        email: '126362406+merdoks@users.noreply.github.com'
      }
    });
    
    console.log(`Created commit: ${commit.sha}`);
    
    // Update or create main ref
    try {
      await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: 'heads/main',
        sha: commit.sha,
        force: true
      });
      console.log('Updated main branch ref');
    } catch (e) {
      // Create ref if it doesn't exist
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: 'refs/heads/main',
        sha: commit.sha
      });
      console.log('Created main branch ref');
    }
    
    return {
      success: true,
      message: `✅ Successfully pushed ${treeItems.length} files to GitHub!`,
      url: `https://github.com/${owner}/${repo}`,
      filesCount: treeItems.length,
      commit: commit.sha
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data || 'Unknown error'
    };
  }
}
