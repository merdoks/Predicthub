import { getGitHubClient } from './github-helper';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const IGNORE_PATHS = ['node_modules', '.git', '.cache', 'attached_assets', '.upm', 'dist', 'build', 'package-lock.json'];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATHS.some(ignore => filePath.includes(ignore));
}

export async function uploadViaContentAPI() {
  try {
    const octokit = await getGitHubClient();
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const owner = user.login;
    const repo = 'PredictHub';
    
    console.log(`Starting upload to GitHub as ${owner}...`);
    
    const gitFilesOutput = execSync('git ls-files', { 
      encoding: 'utf-8',
      cwd: '/home/runner/workspace'
    });
    
    const trackedFiles = gitFilesOutput
      .trim()
      .split('\n')
      .filter(f => f && !shouldIgnore(f) && f.trim());
    
    console.log(`Found ${trackedFiles.length} files to upload`);
    
    let uploadedCount = 0;
    const errors = [];
    
    // Upload files one by one with SHA handling
    for (const filePath of trackedFiles) {
      try {
        const fullPath = path.join('/home/runner/workspace', filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Try to get existing file SHA
        let sha = undefined;
        try {
          const { data: existingFile } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: 'main'
          });
          if ('sha' in existingFile) {
            sha = existingFile.sha;
          }
        } catch (e) {
          // File doesn't exist yet, that's fine
        }
        
        // Upload file via content API
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: filePath,
          message: `Add ${filePath}`,
          content: Buffer.from(content).toString('base64'),
          branch: 'main',
          ...(sha && { sha })
        });
        
        uploadedCount++;
        if (uploadedCount % 20 === 0) {
          console.log(`Uploaded ${uploadedCount}/${trackedFiles.length}...`);
        }
      } catch (e: any) {
        errors.push(`${filePath}: ${e.message}`);
      }
    }
    
    console.log(`✅ Upload complete: ${uploadedCount}/${trackedFiles.length} files`);
    
    return {
      success: true,
      message: `✅ Successfully uploaded ${uploadedCount}/${trackedFiles.length} files to GitHub!`,
      url: `https://github.com/${owner}/${repo}`,
      filesCount: uploadedCount,
      errors: errors.length > 0 ? errors.slice(0, 3) : []
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data || error.toString()
    };
  }
}
