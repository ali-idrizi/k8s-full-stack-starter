import { WithAuth } from '@/hocs'
import Home from '@/pages/index'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'

const getMockData = jest.fn().mockResolvedValue([{ title: 'Test' }])

describe('Home', () => {
  const queryClient = new QueryClient()

  beforeEach(async () => {
    await queryClient.fetchQuery(['todos'], getMockData)

    queryClient.setQueryData<WithAuth>(['auth'], {
      userId: 'test-user-id',
      needsRefresh: false,
    })
  })

  it('renders a heading', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Home />
      </QueryClientProvider>,
    )

    const heading = screen.getByRole('heading', {
      name: /welcome test-user-id/i,
    })

    const todos = await screen.findByTestId('todos')

    expect(getMockData).toHaveBeenCalledTimes(1)
    expect(heading).toBeInTheDocument()
    expect(todos).toHaveTextContent('Test')
  })
})
