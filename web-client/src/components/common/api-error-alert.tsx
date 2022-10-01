import { ApiError } from '@/api'
import { Alert, AlertIcon, Box, List, ListItem } from '@chakra-ui/react'
import dynamic from 'next/dynamic'

const Collapse = dynamic(() => import('@chakra-ui/transition').then((chakra) => chakra.Collapse))

type Props = {
  error: ApiError | null
}

const ErrorAlert: React.FC<Required<Props>> = ({ error }) => {
  if (error === null) {
    return null
  }

  return (
    <Alert status="error">
      <AlertIcon />

      {typeof error.data === 'string' ? (
        error.data
      ) : (
        <List>
          {error.data.map((item, index) => (
            <ListItem key={index}>{item}</ListItem>
          ))}
        </List>
      )}
    </Alert>
  )
}

export const ApiErrorAlert: React.FC<Props> = ({ error }) => {
  return (
    <Collapse in={error !== null} unmountOnExit>
      <Box mt="8" w="full">
        <ErrorAlert error={error} />
      </Box>
    </Collapse>
  )
}
