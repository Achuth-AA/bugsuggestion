# bugsuggestion"""RPC server for the BugSuggestion service."""


from collections.abc import Sequence
import logging
import traceback


from absl import app
from absl import flags
import pandas as pd


from google3.google.protobuf import field_mask_pb2
from google3.google.devtools.issuetracker.v1 import issuetracker_builders
from google3.google.devtools.issuetracker.v1 import issuetracker_client
from google3.google.devtools.issuetracker.v1 import issuetracker_pb2
from google3.google.devtools.issuetracker.v1 import issuetracker_service_pb2
from google3.java.com.google.search.xep.solutions.bug_suggestion.proto import bug_suggestion_pb2
from google3.java.com.google.search.xep.solutions.bug_suggestion.utils import bug_utils
from google3.java.com.google.search.xep.solutions.bug_suggestion.utils import link_utils
from google3.java.com.google.search.xep.solutions.bug_suggestion.utils.config import config
from google3.javatests.com.google.assistant.assistantserver.manual.tests.aiml_main.bug_suggestion.bug_suggestion_server.bug_duplicacy import find_duplicate
from google3.net.rpc.python import pywraprpc
from google3.net.rpc.python import rpcserver
from google3.pyglib.contrib.sidecar import sidecar
from google3.security.loas.lib.public.python import loas_util




_PORT = flags.DEFINE_integer('port', 9999, 'Port to serve on.')
_RPC_THREADS = flags.DEFINE_integer(
   'rpc_threads', 5, 'Number of threads to use for processing requests.'
)




class BugSuggestionServer(sidecar.Sidecar):
   """RPC server for the BugSuggestion service."""


   def __init__(self, port: int, rpc_threads: int):
       super().__init__(
           'Bug Suggestion Server',
           port=port,
           export_name='java.com.google.search.xep.solutions.bug_suggestion.proto.BugSuggestionService',
       )
       self.config = config.get_config()
       self.current_user = (
           loas_util.LOASUtil.GetDefaultUserNameNonBlockingAsString()
       )
       self.db_operation = bug_utils.DBOperation()
       self.client = issuetracker_client.BuildDefault(
           use_prod=True,
           api_key=self.config['buganizer']['issuetracker_api_key'],
       )
       self.expander = link_utils.GolinkTargetUrlFetcher()
       self.find_duplicate = find_duplicate.FindDuplicate()


   @rpcserver.Handler(
       bug_suggestion_pb2.BugSuggestionCommentRequest,
       bug_suggestion_pb2.BugSuggestionCommentResponse,
   )


   def add_bug_suggestion_comment(
       self,
       unused_rpc: pywraprpc.RPC,
       request: bug_suggestion_pb2.BugSuggestionCommentRequest,
       response: bug_suggestion_pb2.BugSuggestionCommentResponse,
   ) -> bug_suggestion_pb2.BugSuggestionCommentResponse:
       """Adds a comment to the bug."""
       logging.info('Comment added for bug: %s', request)
       print("*********************")
       print("Comment added for bug: %s", request)
       print("*********************")
       issue_comment = issuetracker_pb2.IssueComment(
           comment=request.comment_text,
           formatting_mode=issuetracker_pb2.FormattingMode.MARKDOWN,
       )
       issue_comment_request = (
           issuetracker_service_pb2.CreateIssueCommentRequest(
               issue_id=int("465673160"),
               comment=issue_comment,
           )
       )
       issue_comment_response = self.client.stub.CreateIssueComment(
           issue_comment_request
       )
       logging.info('Issue comment response: %s', issue_comment_response)
       response.comment_added_status = 'Comment added successfully.'
       return response


   @rpcserver.Handler(
       bug_suggestion_pb2.UpdateStatusAddCommentRequest,
       bug_suggestion_pb2.UpdateStatusAddCommentResponse,
   )
   def update_status_add_comment(
       self,
       unused_rpc: pywraprpc.RPC,
       request: bug_suggestion_pb2.UpdateStatusAddCommentRequest,
       response: bug_suggestion_pb2.UpdateStatusAddCommentResponse,
   ) -> bug_suggestion_pb2.UpdateStatusAddCommentResponse:
       """Updates the status and adds a comment to the specified bug."""
       logging.info('Updating status and adding comment for request: %s', request)
       try:
           # updating the status of the bug to assigned
           modify_issue_request = issuetracker_service_pb2.ModifyIssueRequest(
               issue_id=int("465673126"),
               add_mask=field_mask_pb2.FieldMask(paths=['status','assignee']),
               add=issuetracker_pb2.IssueState(
                   status=issuetracker_pb2.Issue.Status.ASSIGNED,
                   assignee=issuetracker_pb2.User(
                       email_address='sripathip@google.com'
                   ),
               ),
           )
           modify_issue_response = self.client.stub.ModifyIssue(modify_issue_request)


           logging.info('Modify issue response: %s', modify_issue_response.issue_id)
           logging.info(
               'Modify issue response: %s',
               modify_issue_response.issue_state.status,
           )
           logging.info(
               'Modify issue response: %s',
               modify_issue_response.issue_comment.comment,
           )
           response.bug_issue_id = request.bug_issue_id
           response.bug_status = issuetracker_pb2.Issue.Status.Name(
               modify_issue_response.issue_state.status
           )
           response.server_message = (
               'Bug status changed to Assigned and comment added successfully.'
           )
           return response
       except pywraprpc.RPCException as e:
           error_message = (
               'Error while updating status and adding comment:'
               f' {e}\n{traceback.format_exc()}'
           )
           logging.info(error_message)
           response.bug_issue_id = request.bug_issue_id
           response.bug_status = 'ERROR'
           response.server_message = error_message
           return response


   @rpcserver.Handler(
       bug_suggestion_pb2.MarkAsDuplicateBugSuggestionRequest,
       bug_suggestion_pb2.MarkAsDuplicateBugSuggestionResponse,
   )
   def mark_as_duplicate_bug_suggestion(
       self,
       unused_rpc: pywraprpc.RPC,
       request: bug_suggestion_pb2.MarkAsDuplicateBugSuggestionRequest,
       response: bug_suggestion_pb2.MarkAsDuplicateBugSuggestionResponse,
   ) -> bug_suggestion_pb2.MarkAsDuplicateBugSuggestionResponse:
       """Marks the bug as duplicate."""
       logging.info('Bug marked as duplicate: %s', request)


       try:
           mark_as_duplicate_request = (
               issuetracker_service_pb2.MarkIssueAsDuplicateRequest(
                   issue_id=request.bug_issue_id,
                   target_id=request.target_id,
               )
           )


           logging.info('Mark as duplicate request: %s', mark_as_duplicate_request)
           self.client.stub.MarkIssueAsDuplicate(mark_as_duplicate_request)
           return_status = 'Bug marked as duplicate successfully.'
           response.mark_as_duplicate_status = return_status
           return response
       except pywraprpc.RPCException as e:
           error_message = (
               f'Error while marking bug as duplicate: {e}\n{traceback.format_exc()}'
           )
           logging.info(error_message)
           response.mark_as_duplicate_status = error_message
           return response


   @rpcserver.Handler(
       bug_suggestion_pb2.GenerateBugTemplateRequest,
       bug_suggestion_pb2.GenerateBugTemplateResponse,
   )
   def generate_bug_template(
       self,
       unused_rpc: pywraprpc.RPC,
       request: bug_suggestion_pb2.GenerateBugTemplateRequest,
       response: bug_suggestion_pb2.GenerateBugTemplateResponse,
   ) -> bug_suggestion_pb2.GenerateBugTemplateResponse:
       """Raises a bug template for the given query."""
       print('serverZone _ generate_bug_template')
       logging.info('Raising bug template for query: %s', request)
       print('Raising bug template for query: %s', request)


       template_value = self.db_operation.get_data_from_table(
           'Bug_Template_Assistant_link',
           request.portfolio,
           request.product_area,
           request.testing_type,
           request.bug_types,
           request.verticals,
       )


       logging.info('Template value: %s', template_value)
       print('Template value: %s', template_value)
       target_url = self.expander.get_expandedurl(template_value)
       response_setter = self.db_operation.parse_bug_url_to_object(
           target_url
       )
       logging.info('Response setter: %s', response_setter)
       get_component_response = self.get_component(
           response_setter.bug_component_id
       )


       logging.info('Get component response: %s', get_component_response)
       response_setter.bug_component_description = (
           get_component_response
       )
       response.CopyFrom(response_setter)
       return response


   @rpcserver.Handler(
       bug_suggestion_pb2.CreateIssueRequest,
       bug_suggestion_pb2.CreateIssueResponse,
   )
   def create_issue(
       self,
       unused_rpc: pywraprpc.RPC,
       request: bug_suggestion_pb2.CreateIssueRequest,
       response: bug_suggestion_pb2.CreateIssueResponse,
   ) -> bug_suggestion_pb2.CreateIssueResponse:
       """Creates a bug."""
       logging.info('Creating bug for request: %s', request)


       try:
           logging.info('Client created successfully!')
           create_issue_request = issuetracker_service_pb2.CreateIssueRequest(
               issue=issuetracker_pb2.Issue(
                   issue_state=issuetracker_pb2.IssueState(
                       component_id=int(request.bug_component_id),
                       type=issuetracker_pb2.Issue.Type.Value(request.bug_type),
                       status=issuetracker_pb2.Issue.Status.Value(
                           request.bug_status
                       ),
                       assignee=issuetracker_pb2.User(
                           email_address=self.current_user
                       ),
                       reporter=issuetracker_pb2.User(
                           email_address=self.current_user
                       ),
                       priority=issuetracker_pb2.Issue.Priority.Value(
                           request.bug_priority
                       ),
                       severity=issuetracker_pb2.Issue.Severity.Value(
                           request.bug_severity
                       ),


                       title=request.bug_title,
                       hotlist_ids=[
                           int(hotlist_id) for hotlist_id in request.bug_hotlist_id
                       ],
                       ccs=[
                           issuetracker_pb2.User(email_address=cc)
                           for cc in request.bug_cc_list
                       ],
                       in_prod=request.bug_in_prod,
                   ),
                   issue_comment=issuetracker_pb2.IssueComment(
                       comment=request.bug_description,
                       formatting_mode=issuetracker_pb2.FormattingMode.Value(
                           request.format
                       ),
                   ),
               ),
           )
           create_issue_response = self.client.stub.CreateIssue(create_issue_request)
           response.issue_created_id = str(create_issue_response.issue_id)
           return response
       except pywraprpc.RPCException as e:
           error_message = f'Error while creating bug: {e}\n{traceback.format_exc()}'
           logging.info(error_message)
           response.issue_created_id = error_message
           return response


   def _get_issue_details(self, issue_id: str):
       """Fetches title, status, and created time for a given issue ID."""
       try:
           logging.info('Fetching details for issue %s.', issue_id)
           issue_request = issuetracker_service_pb2.GetIssueRequest(
               issue_id=int(issue_id)
           )
           issue_response = self.client.stub.GetIssue(issue_request)


           # Convert created_time to a string for simpler transport
           created_at_str = issue_response.created_time.ToDatetime().isoformat()


           details = {
               'bug_title': issue_response.issue_state.title,
               'bug_status': issuetracker_pb2.Issue.Status.Name(
                   issue_response.issue_state.status
               ),
               'created_at': created_at_str,
           }
           logging.info('Successfully fetched details for issue %s: %s', issue_id, details)
           return details
       except pywraprpc.RPCException as e:
           logging.warning(
               'Error fetching details for issue %s: %s', issue_id, e
           )
           return {
               'bug_title': 'N/A',
               'bug_status': 'N/A',
               'created_at': 'N/A',
           }
       except Exception as e:
            logging.error(
               'Unexpected error while fetching issue %s details: %s\n%s',
               issue_id, e, traceback.format_exc()
           )
            return {
               'bug_title': 'N/A',
               'bug_status': 'N/A',
               'created_at': 'N/A',
           }


   @rpcserver.Handler(
       bug_suggestion_pb2.BugSummaryRequest,
       bug_suggestion_pb2.BugSummaryResponse,
   )
   def generate_bug_summary(
       self,
       unused_rpc: pywraprpc.RPC,
       request: bug_suggestion_pb2.BugSummaryRequest,
       response: bug_suggestion_pb2.BugSummaryResponse,
   ) -> bug_suggestion_pb2.BugSummaryResponse:
       """Generates a summary and finds duplicates for the given bug."""
       logging.info('Generating summary for bug: %s', request)
       bug_data_df = pd.DataFrame({
           'Title': [request.bug_title],
           'Description': [request.bug_description],
           'IssueID': 5434447,  # Placeholder ID
           'Priority': 'P0'
       })
       # Assuming find_duplicate returns a dictionary with 'duplicates' list
       bug_data_with_summary = self.find_duplicate.find_duplicate(
           bug_data_df , "Omnient"
       )
       print('Bug data with summary-----------------: %s', bug_data_with_summary)
       logging.info('Bug data with summary: %s', bug_data_with_summary)


       if (
           bug_data_with_summary
           and 'summary' in bug_data_with_summary
           and bug_data_with_summary['summary']
       ):
           response.summary = bug_data_with_summary['summary']
       else:
           response.summary = 'Summary not available.'
           logging.warning("AIML response missing 'summary'.")


       # Process duplicate bugs
       if (
           bug_data_with_summary
           and 'duplicates' in bug_data_with_summary
           and bug_data_with_summary['duplicates']
       ):
           duplicate_list = bug_data_with_summary['duplicates']
           for dup_data in duplicate_list:
               duplicate_bug = bug_suggestion_pb2.DuplicateBugs()
               if 'bug_issue_id' in dup_data:
                   issue_id = dup_data['bug_issue_id']
                   duplicate_bug.bug_issue_id = issue_id
               if 'match_score' in dup_data:
                   duplicate_bug.match_score = dup_data['match_score']
               if 'bug_title' in dup_data:
                   duplicate_bug.bug_title = dup_data['bug_title']
               if 'bug_status' in dup_data:
                   duplicate_bug.bug_status = dup_data['bug_status']
               if 'created_at' in dup_data:
                   duplicate_bug.created_at = dup_data['created_at']
               if 'bug_priority' in dup_data:
                   duplicate_bug.bug_priority = dup_data['bug_priority']
               if 'action_items' in dup_data:
                   duplicate_bug.action_items = dup_data['action_items']
               response.duplicate_bugs.append(duplicate_bug)
       else:
           logging.warning("AIML response missing 'duplicates' or it's empty.")


       print('Response for bug duplicates: %s', response.duplicate_bugs)
       print('Response for bug summary: %s', response.summary)
       logging.info('Response for bug summary: %s', response.summary)
       logging.info('Response for bug duplicates: %s', response.duplicate_bugs)
       return response


   # 5th extra extra endpoint


   def get_component(
       self,
       component_id: str
   ) -> str:
       """Returns the component description for the given component id."""
       logging.info('Getting component for request: %s', component_id)
       get_component_request = issuetracker_service_pb2.GetComponentRequest(
           component_id=int(component_id)
       )
       get_component_response = self.client.stub.GetComponent(
           get_component_request)


       logging.info(
           'Get component response from server component path names: %s',
           get_component_response.component_path_info.component_path_names,
       )
       if get_component_response.component_path_info.component_path_names:
           component_description = ' > '.join(
               get_component_response.component_path_info.component_path_names
           )
       else:


           component_description = ''


       logging.info(
           'Response for get component after mapping: %s', component_description
       )
       return component_description




def main(argv: Sequence[str]):
   if len(argv) > 1:
       raise app.UsageError('Too many command-line arguments.')


   service = BugSuggestionServer(_PORT.value, _RPC_THREADS.value)
   try:
       service.Start()
   finally:
       service.Stop()




if __name__ == '__main__':
   app.run(main)

