import { getGitHubClient } from './github-helper';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface FileToUpload {
  path: string;
  content: string;
  mode: string;
}

async function getAllProjectFiles(): Promise<FileToUpload[]> {
  try {
    // Get list of tracked files
    const filesOutput = execSync('git ls-files', { 
      cwd: '/home/runner/workspace',
      encoding: 'utf-8' 
    });
    
    const files: FileToUpload[] = [];
    const filePaths = filesOutput.trim().split('\n').filter(f => f && !f.startsWith('node_modules'));
    
    for (const filePath of filePaths) {
      try {
        const fullPath = path.join('/home/runner/workspace', filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({
          path: filePath,
          content,
          mode: '100644'
        });
      } catch (e) {
        console.log(`Skipping file ${filePath}`);
      }
    }
    
    return files;
  } catch (error) {
    console.error('Error reading files:', error);
    throw error;
  }
}

export async function uploadProjectToGitHubAPI() {
  try {
    const octokit = await getGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const owner = user.login;
    
    console.log(`Uploading project to GitHub as ${owner}...`);
    
    // Get repository info
    const { data: repo } = await octokit.rest.repos.get({
      owner,
      repo: 'PredictHub'
    });
    
    // Get all files
    const files = await getAllProjectFiles();
    console.log(`Found ${files.length} files to upload`);
    
    if (files.length === 0) {
      throw new Error('No files to upload');
    }
    
    // Create tree from files
    const treeItems = files.map(file => ({
      path: file.path,
      mode: file.mode as '100644' | '100755' | '040000' | '160000' | '120000',
      type: 'blob' as const,
      content: file.content
    }));
    
    // Create tree
    const { data: tree } = await octokit.rest.git.createTree({
      owner,
      repo: 'PredictHub',
      tree: treeItems,
      base_tree: undefined // No base tree to start fresh
    });
    
    console.log(`Created tree with ${files.length} files`);
    
    // Get commit info
    const authorName = 'merdoks';
    const authorEmail = '126362406+merdoks@users.noreply.github.com';
    const commitMessage = 'Initial commit: PredictHub project pushed via API';
    
    // Create commit
    const { data: commit } = await octokit.rest.git.createCommit({
      owner,
      repo: 'PredictHub',
      tree: tree.sha,
      message: commitMessage,
      author: {
        name: authorName,
        email: authorEmail
      }
    });
    
    console.log(`Created commit: ${commit.sha}`);
    
    // Update main branch reference
    try {
      await octokit.rest.git.updateRef({
        owner,
        repo: 'PredictHub',
        ref: 'heads/main',
        sha: commit.sha
      });
      console.log('Updated main branch');
    } catch (e) {
      // If update fails, try create
      await octokit.rest.git.createRef({
        owner,
        repo: 'PredictHub',
        ref: 'refs/heads/main',
        sha: commit.sha
      });
      console.log('Created main branch');
    }
    
    return {
      success: true,
      message: `Successfully uploaded ${files.length} files to GitHub`,
      repository: repo.html_url,
      filesCount: files.length,
      commit: commit.sha,
      url: `${repo.html_url}/tree/main`
    };
  } catch (error) {
    console.error('Error uploading to GitHub:', error);
    throw error;
  }
}
