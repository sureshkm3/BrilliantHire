# BrilliantHire

The brilliantlunch.js changes are done and two new files userRoute.js and logger.js have been added to the project.These are included in the brilliantlunch.js file.

The second part of the assignment is implemented as a api in the same app . /getBrilliantLunch  post on this with the required data.

the approach to solve is 
1)loop over input array 
2)calculate the overlap duration if less than 30 then ignore this event.
   calculating overlap is as follows
   if candidate  lunch event start time is greater than niki end time or niki start time is after candidate end time overlap is 0 
   if candidate lunch event start is less than niki then start time is niki's time 
   if candidate lunch event end is after niki than end time is niki's time 
      else both start and end time of user is used and duration calculated 
3)check against best event if this event is better this becomes the best event 
4) check for best event  is to check duration if duration is same then check is for which is starting earlier 
