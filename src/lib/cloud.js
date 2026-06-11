// Newest-wins between the local hot save and the cloud snapshot.
// Both args are plain save objects (or null). Ties go to local.
export function decideSource(local, cloud) {
  if (!local && !cloud) return null
  if (!cloud) return 'local'
  if (!local) return 'cloud'
  return (cloud.savedAt || 0) > (local.savedAt || 0) ? 'cloud' : 'local'
}
