# AI SDK Testing Prompts

This document provides step-by-step testing prompts for the Vercel AI SDK implementation in this application.

## Table of Contents
1. [Basic Chat Functionality](#basic-chat-functionality)
2. [Streaming Responses](#streaming-responses)
3. [Tool Usage (Weather Tool)](#tool-usage-weather-tool)
4. [File Attachments](#file-attachments)
5. [Web Search Integration](#web-search-integration)
6. [Model Switching](#model-switching)
7. [Message Actions](#message-actions)
8. [Context-Specific Testing](#context-specific-testing)
9. [Edge Cases & Error Handling](#edge-cases--error-handling)
10. [Performance Testing](#performance-testing)

---

## Basic Chat Functionality

### Test 1: Simple Question
**Purpose:** Verify basic chat functionality
```
Hello! Can you introduce yourself?
```
**Expected:** 
- Message appears in chat
- AI responds with introduction
- Message shows in conversation history

### Test 2: Follow-up Question
**Purpose:** Test conversation context
```
What can you help me with?
```
**Expected:**
- AI remembers previous context
- Provides relevant capabilities based on the application

### Test 3: Multi-turn Conversation
**Purpose:** Test conversation memory
```
1. "My name is [Your Name]"
2. "What's my name?"
3. "Can you remember what we just talked about?"
```
**Expected:**
- AI remembers your name
- AI recalls previous conversation topics

---

## Streaming Responses

### Test 4: Long Response
**Purpose:** Verify streaming functionality
```
Write a detailed 500-word guide about planning a luxury hotel stay in Iceland, including recommendations for activities, dining, and accommodation.
```
**Expected:**
- Text streams in progressively (not all at once)
- Loader appears while generating
- Smooth rendering of chunks

### Test 5: Code Generation
**Purpose:** Test streaming with formatted content
```
Write a JavaScript function that calculates the total cost of a hotel stay including taxes and fees.
```
**Expected:**
- Code blocks render correctly during streaming
- Syntax highlighting works
- Formatting is preserved

---

## Tool Usage (Weather Tool)

### Test 6: Direct Weather Request
**Purpose:** Test weather tool invocation
```
What's the weather like in Reykjavik?
```
**Expected:**
- Tool is automatically called
- Weather data is returned (random temperature between 32-90°F)
- Response includes location and temperature

### Test 7: Multiple Location Weather
**Purpose:** Test multiple tool calls
```
Compare the weather in Paris, New York, and Tokyo.
```
**Expected:**
- Tool is called three times
- All three locations are compared
- Temperature data for each location

### Test 8: Weather in Context
**Purpose:** Test tool usage with context
```
I'm planning a trip to Dubai next week. What's the weather like there?
```
**Expected:**
- Tool is called for Dubai
- Response includes travel planning advice
- Weather data integrated into response

---

## File Attachments

### Test 9: Single Image Upload
**Purpose:** Test file attachment functionality
1. Click the attachment button (menu icon)
2. Select "Add Attachments"
3. Upload an image file
4. Type: "What do you see in this image?"

**Expected:**
- Image appears as attachment
- Can remove attachment before sending
- Message sends with attachment

### Test 10: Multiple Files
**Purpose:** Test multiple file handling
1. Upload 2-3 images
2. Type: "Analyze these images"

**Expected:**
- All attachments display correctly
- Can remove individual attachments
- Message sends with all files

### Test 11: Drag & Drop
**Purpose:** Test global drop functionality
1. Drag an image file over the chat area
2. Drop it on the input area
3. Send with message

**Expected:**
- Drop zone activates
- File attaches successfully
- Message sends correctly

---

## Web Search Integration

### Test 12: Basic Web Search
**Purpose:** Test web search toggle
1. Click the "Search" button to enable web search (should turn blue/active)
2. Type: "What are the latest hotel openings in 2025?"

**Expected:**
- Search button shows active state
- Response includes current information
- Sources may appear (if implemented)

### Test 13: Without Web Search
**Purpose:** Compare responses without web search
1. Ensure "Search" button is OFF (inactive)
2. Type: "What are the latest hotel openings in 2025?"

**Expected:**
- Response based on training data only
- No real-time information
- May indicate knowledge cutoff

---

## Model Switching

### Test 14: GPT-4o Model
**Purpose:** Test model switching to GPT-4o
1. Click the model selector dropdown
2. Select "GPT 4o"
3. Type: "Explain your capabilities"

**Expected:**
- Model switches successfully
- Response reflects GPT-4o style
- Subsequent messages use new model

### Test 15: Deepseek R1 Model
**Purpose:** Test Deepseek R1 model
1. Switch to "Deepseek R1"
2. Type: "Solve this problem: If a hotel has 200 rooms and 85% occupancy, how many rooms are occupied?"

**Expected:**
- Model switches successfully
- Mathematical reasoning is displayed
- Correct answer provided

### Test 16: Model Comparison
**Purpose:** Compare model responses
```
Same prompt to both models:
"Write a marketing email for a new boutique hotel opening"
```
**Expected:**
- Different response styles
- Both complete the task
- No errors during switching

---

## Message Actions

### Test 17: Copy Message
**Purpose:** Test copy functionality
1. Send any message and get a response
2. Click the copy icon on the AI response
3. Paste in a text editor

**Expected:**
- Copy icon appears on hover
- Message copies to clipboard
- Full message text is copied

### Test 18: Regenerate Response
**Purpose:** Test regenerate functionality
1. Send: "Generate a hotel name"
2. Click the regenerate icon
3. Observe new response

**Expected:**
- Regenerate icon appears
- New response generates
- Previous response is replaced
- Different answer provided

---

## Context-Specific Testing

### Test 19: Hotels Context
**Navigate to:** `/hotels` page
**Purpose:** Test hotel-specific queries
```
Find me luxury resorts in Bali that opened in 2023 with more than 100 rooms.
```
**Expected:**
- AI understands hotel context
- Provides relevant hotel information
- Can trigger middle chat with results

### Test 20: Contacts Context
**Navigate to:** `/contacts` page
**Purpose:** Test contact discovery
```
I need to find the Director of Sales for Marriott Hotels in Singapore.
```
**Expected:**
- AI provides contact information
- Can trigger contacts middle chat
- Suggests adding to contacts

### Test 21: Advisors Context
**Navigate to:** `/advisors` page
**Purpose:** Test advisor discovery
```
Find me travel advisors specializing in luxury European travel with at least 5 years experience.
```
**Expected:**
- AI provides advisor recommendations
- Can trigger advisors middle chat
- Shows relevant certifications/experience

### Test 22: Marketing Context
**Navigate to:** `/marketing` page
**Purpose:** Test marketing campaign assistance
```
Help me create a newsletter template for announcing a new hotel opening in Dubai.
```
**Expected:**
- AI generates marketing content
- Can trigger marketing middle chat
- Shows newsletter templates

### Test 23: Itineraries Context
**Navigate to:** `/itineraries` page
**Purpose:** Test itinerary creation
```
Create a 7-day luxury itinerary for a couple visiting Iceland with a budget of $10,000.
```
**Expected:**
- AI creates detailed itinerary
- Can trigger itineraries middle chat
- Shows day-by-day breakdown

---

## Edge Cases & Error Handling

### Test 24: Empty Message
**Purpose:** Test validation
1. Try to send message with empty input
2. Try with only spaces

**Expected:**
- Submit button disabled
- No message sent
- No error thrown

### Test 25: Very Long Message
**Purpose:** Test input limits
```
[Paste a message with 5000+ characters]
```
**Expected:**
- Message sends successfully OR
- Graceful error message about length
- No UI breaking

### Test 26: Special Characters
**Purpose:** Test character handling
```
Test with symbols: !@#$%^&*()_+-=[]{}|;:'",.<>?/~`
```
**Expected:**
- All characters display correctly
- No encoding issues
- Response handles special chars

### Test 27: Unicode & Emojis
**Purpose:** Test unicode support
```
🏨 Looking for hotels in Tokyo 東京 with 🌟🌟🌟🌟🌟 ratings
```
**Expected:**
- Emojis display correctly
- Unicode characters preserved
- AI understands context

### Test 28: Rapid Fire Messages
**Purpose:** Test rate limiting/queuing
1. Send 5 messages in quick succession
2. Don't wait for responses

**Expected:**
- Messages queue properly
- No messages lost
- Responses arrive in order

### Test 29: Network Interruption
**Purpose:** Test error handling
1. Start a message
2. Disconnect internet mid-response
3. Reconnect

**Expected:**
- Graceful error message
- Can retry after reconnection
- No data loss

---

## Performance Testing

### Test 30: First Message Latency
**Purpose:** Measure cold start time
1. Reload the page
2. Send first message
3. Note time to first token

**Expected:**
- Reasonable latency (< 3 seconds)
- Clear loading indicator
- No timeout

### Test 31: Subsequent Message Latency
**Purpose:** Measure warm response time
1. Send a follow-up message immediately
2. Note time to first token

**Expected:**
- Faster than first message
- Consistent streaming speed
- Smooth UX

### Test 32: Large Context Window
**Purpose:** Test memory limits
1. Have a long conversation (10+ messages)
2. Reference something from first message
3. Continue conversation

**Expected:**
- Context is maintained
- No memory errors
- Responses remain relevant

---

## Prompt Library Testing

### Test 33: Open Prompt Library
**Purpose:** Test prompt library functionality
1. Click the Sparkles icon in chat header
2. Browse available prompts
3. Click a prompt to use it

**Expected:**
- Library slides in from right
- Prompts are categorized by topic
- Clicking inserts prompt into input

### Test 34: Search Prompts
**Purpose:** Test prompt search
1. Open prompt library
2. Type in search: "hotel"
3. Review filtered results

**Expected:**
- Results filter in real-time
- Relevant prompts shown
- Can still insert prompts

---

## Middle Chat (Deep Search) Testing

### Test 35: Trigger Middle Chat
**Purpose:** Test middle chat integration
1. Click the AppWindow icon in chat header
2. Observe middle panel

**Expected:**
- Middle panel slides in
- Shows context-appropriate content
- Can interact with cards/results

### Test 36: Close Middle Chat
**Purpose:** Test closing functionality
1. Open middle chat
2. Click X button to close
3. Verify it closes

**Expected:**
- Panel slides out smoothly
- Can reopen again
- State is preserved

---

## Agent Selection Testing

### Test 37: Switch Agents
**Purpose:** Test agent dropdown
1. Click "Select Agent" dropdown
2. Choose "Marketing"
3. Send a relevant query

**Expected:**
- Agent switches successfully
- Response style may change
- Context adjusts to agent type

---

## Integration Testing

### Test 38: Full Workflow - Hotel Discovery
**Purpose:** Test complete hotel discovery workflow
1. Open right chat
2. Type: "Find luxury hotels in Paris"
3. Click deep search icon
4. Review results in middle chat
5. Click "Add to website" on a hotel
6. Navigate to Hotels page
7. Verify hotel appears (mock)

**Expected:**
- Smooth workflow
- All components work together
- Data flows correctly

### Test 39: Full Workflow - Contact Discovery
**Purpose:** Test complete contact workflow
1. Navigate to Contacts page
2. Open right chat
3. Type: "Find hotel managers in New York"
4. Trigger middle chat
5. Review contact cards
6. Click "Add to Contact"

**Expected:**
- Contact-specific results shown
- Can add to contacts
- UI remains responsive

---

## Troubleshooting Common Issues

### Issue 1: Chat Not Responding
**Check:**
- Is `AI_GATEWAY_API_KEY` set in `.env.local`?
- Is the dev server running?
- Check browser console for errors
- Verify API route at `/api/chat` is accessible

### Issue 2: Streaming Not Working
**Check:**
- Network tab shows "stream" response type
- No middleware blocking streaming
- Browser supports streaming (all modern browsers do)

### Issue 3: Tools Not Called
**Check:**
- Weather queries must mention location
- Tool schema is correct in `route.ts`
- Model supports tool calling

### Issue 4: Attachments Not Working
**Check:**
- File size limits (if any)
- File type restrictions
- Browser file API support
- Network upload limits

---

## Success Criteria Summary

✅ **Basic Functionality**
- Messages send and receive correctly
- Conversation history maintained
- UI responsive and smooth

✅ **Advanced Features**
- Streaming works smoothly
- Tools are called when appropriate
- File attachments handled correctly
- Web search integrates properly

✅ **User Experience**
- Fast response times
- Clear loading states
- Helpful error messages
- Intuitive interactions

✅ **Reliability**
- No crashes or freezes
- Handles edge cases gracefully
- Recovers from errors
- Data integrity maintained

---

## Notes for Developers

- Test in both light and dark modes
- Test on different screen sizes
- Test keyboard shortcuts (if any)
- Monitor console for warnings
- Check network requests in DevTools
- Verify no memory leaks in long sessions
- Test with different browser extensions enabled/disabled

---

## Reporting Issues

When reporting an issue, include:
1. **Test number and description**
2. **Steps to reproduce**
3. **Expected vs actual behavior**
4. **Browser and version**
5. **Console errors (if any)**
6. **Network response (if relevant)**
7. **Screenshots or video**

---

*Last Updated: December 19, 2025*

