import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 60000,
})

export const startInterview = (jobRole) =>
  api.post('/start-interview', { job_role: jobRole })

export const submitAnswer = (question, answer, jobRole, autoSubmitted = false) =>
  api.post('/submit-answer', {
    question,
    answer,
    job_role: jobRole,
    auto_submitted: autoSubmitted,
  })

export const saveSession = (data) =>
  api.post('/save-session', data)

export const getSessionHistory = () =>
  api.get('/session-history')

export default api
