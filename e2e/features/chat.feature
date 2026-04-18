@chat
Feature: AI Chat Assistant
  As an EKAP employee
  I want to interact with the AI assistant
  So that I can get help with HR tasks

  Scenario: Chat interface loads successfully
    Given I am on the chat page
    Then the chat input field is visible
    And the send button is visible

  Scenario: Sending a message shows a response
    Given I am on the chat page
    When I type "What is the vacation policy?" in the chat
    And I send the message
    Then my message appears in the chat
    And I receive a response from the assistant

  Scenario: Name change intent triggers an action chip
    Given I am on the chat page
    When I type "I would like to change my last name" in the chat
    And I send the message
    Then I receive a response from the assistant
    And a "Start Name Change Request" action chip appears
