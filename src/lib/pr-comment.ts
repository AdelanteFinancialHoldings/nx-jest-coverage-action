import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'

/**
 * Creates or updates a PR comment with the coverage report
 * @param reportContent The content of the report
 * @param reportAnchor The anchor key for the report
 * @returns True if the comment was created or updated, false otherwise
 */
export async function upsertPRComment({
  reportContent,
  reportAnchor,
  githubToken
}: {
  reportContent: string
  reportAnchor: string
  githubToken: string
}): Promise<boolean> {
  // Check if we're in a PR context
  console.log('Github context', context)
  if (!context.payload.pull_request) {
    core.info('Not in a PR context, skipping comment creation')
    return false
  }

  if (!githubToken) {
    core.error('No GitHub token found, cannot create PR comment')
    return false
  }

  const octokit = getOctokit(githubToken)
  const { owner, repo } = context.repo
  const pull_request_number = context.payload.pull_request.number

  try {
    // Get all comments in the PR
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: pull_request_number
    })

    console.log('Total PR comments:', comments.length)

    // Find an existing comment with our anchor
    const existingComment = comments.find((comment) =>
      comment.body?.includes(reportAnchor)
    )

    console.log('Existing comment:', existingComment)

    if (existingComment) {
      // Update the existing comment
      core.info(`Updating existing comment with ID ${existingComment.id}`)
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body: reportContent
      })
    } else {
      // Create a new comment
      core.info('Creating new comment')
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pull_request_number,
        body: reportContent
      })
    }

    return true
  } catch (error) {
    core.error(
      `Error creating/updating PR comment: ${error instanceof Error ? error.message : String(error)}`
    )
    return false
  }
}
