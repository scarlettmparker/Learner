import { executeGraphQL } from "./auth.js";
import {
  BulkCreateQuestionsDocument,
  ListQuestionsDocument,
  SubmitAnswerDocument,
  type AnswerInput,
  type BulkCreateQuestionsMutation,
  type BulkCreateQuestionsMutationVariables,
  type ListQuestionsQuery,
  type ListQuestionsQueryVariables,
  type QuestionInput,
  type SubmitAnswerMutation,
  type SubmitAnswerMutationVariables,
} from "./generated/graphql.js";

/**
 * Bulk creates questions.
 *
 * @param inputs - question inputs
 * @param token - auth token
 * @returns result
 */
export async function bulkCreateQuestions(
  inputs: QuestionInput[],
  token: string,
) {
  const data = await executeGraphQL<BulkCreateQuestionsMutation>(
    BulkCreateQuestionsDocument,
    { inputs } as BulkCreateQuestionsMutationVariables,
    token,
  );
  return data.questionMutations.bulkCreateQuestions;
}

/**
 * Submits an answer for a question.
 *
 * @param questionId - question id
 * @param input - answer input
 * @param token - auth token
 * @returns result
 */
export async function submitAnswer(
  questionId: string,
  input: AnswerInput,
  token: string,
) {
  const data = await executeGraphQL<SubmitAnswerMutation>(
    SubmitAnswerDocument,
    { questionId, input } as SubmitAnswerMutationVariables,
    token,
  );
  return data.questionMutations.submitAnswer;
}

/**
 * Lists questions for a remote object.
 *
 * @param remoteObject - remote object filter
 * @param pagination - pagination input
 * @param token - auth token
 * @returns paged questions
 */
export async function listQuestions(
  remoteObject: string,
  pagination: ListQuestionsQueryVariables["pagination"],
  token: string,
) {
  const data = await executeGraphQL<ListQuestionsQuery>(
    ListQuestionsDocument,
    { remoteObject, pagination } as ListQuestionsQueryVariables,
    token,
  );
  return data.questionQueries.listQuestions;
}
