/**
 * Sample backend used when VITE_USE_MOCKS=true, so the UI can be demoed without TDaaS.
 * Shapes here are guesses, not the real API.
 */
const WORKFLOWS = [
  { name: 'create_user', description: 'Creates a user account that can sign in.' },
  { name: 'create_claim', description: 'Creates a claim for an existing policy holder.' },
  { name: 'create_supplier', description: 'Creates a supplier with contact and bank details.' },
  { name: 'create_policy', description: 'Creates an active policy for a customer.' },
  { name: 'create_invoice', description: 'Creates an invoice from a supplier.' },
  { name: 'update_claim_status', description: 'Moves a claim to a new status.' },
]

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input)
  await wait(500 + Math.random() * 400)
  if (url.endsWith('/health-check')) return json({ status: 'UP' })
  if (url.endsWith('/workflows')) return json(WORKFLOWS)
  if (url.endsWith('/suggest-prompts')) {
    const { requirement = '' } = JSON.parse(String(init?.body ?? '{}'))
    if (!/claim|user|policy|supplier|invoice/i.test(requirement)) return json({ prompts: [] })
    return json({
      prompts: ['Create a user with an active auto policy', 'Create an open claim for that user'],
    })
  }
  if (url.endsWith('/retrieve')) {
    const body = JSON.parse(String(init?.body ?? '{}'))
    return json({
      test_case_id: body.test_case_id,
      status: 'success',
      cached: !body.bypass_cache,
      results: (body.prompts ?? []).map((prompt: string, i: number) => ({
        prompt,
        workflow: i === 0 ? 'create_user' : 'create_claim',
        data: i === 0
          ? { user_id: 'USR-58213', username: 'qa.jordan.lee', email: 'jordan.lee@example.com' }
          : { claim_number: 'CLM-2026-004517', claim_status: 'Open' },
      })),
    })
  }
  return json({ message: 'Not found' }, 404)
}
