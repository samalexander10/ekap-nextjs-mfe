@name-change
Feature: HR Name Change Request
  As an EKAP employee
  I want to submit a legal name change request
  So that my records are updated in the system

  Scenario: Name change form opens when action chip is clicked
    Given I am on the chat page
    And I have triggered the name change flow
    When I click the "Start Name Change Request" action chip
    Then the name change form is visible
    And I see a field for the new last name
    And I see a submit button

  Scenario: Submitting a name change request shows confirmation
    Given I am on the chat page
    And I have triggered the name change flow
    And I have opened the name change form
    When I enter "Smith" as the new last name
    And I select "Marriage Certificate" as the document type
    And I upload a supporting document
    And I submit the name change form
    Then I see a submission confirmation
