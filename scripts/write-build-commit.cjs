const { execFileSync } = require('node:child_process')
const { existsSync, writeFileSync } = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const outputDirectory = path.join(projectRoot, 'dist')
const outputFile = path.join(outputDirectory, 'commit.txt')

if (!existsSync(outputDirectory)) {
  throw new Error(`Build output directory not found: ${outputDirectory}`)
}

const commitDetails = execFileSync(
  'git',
  ['log', '-1', '--format=%H%x00%cI%x00%an%x00%s%x00%b'],
  {
    cwd: projectRoot,
    encoding: 'utf8',
  },
)
  .trimEnd()
  .split('\0')

const [hash, date, author, subject, body] = commitDetails

if (!hash || !date || !author || !subject) {
  throw new Error('Unable to read the latest Git commit details.')
}

const commitInfo = [
  `Commit: ${hash}`,
  `Date: ${date}`,
  `Author: ${author}`,
  `Subject: ${subject}`,
  ...(body ? ['', 'Description:', body] : []),
  '',
].join('\n')

writeFileSync(outputFile, commitInfo, 'utf8')
console.log(`Wrote build commit details to ${path.relative(projectRoot, outputFile)}`)
