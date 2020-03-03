Dim A As Integer, B As Integer

A = 0
B = 10

' pre
Do While A < B
  A = A + 1
Loop

Do Until A > B
  A = A + 1
Loop

' post
Do
  A = A + 1
Loop While A < B

Do
  A = A + 1
Loop Until A > B

' nested mixed
Do While A < B
  Do
    If A % 2 Then Call Factorial(A) Else Exit Do
    A = A + 1
  Loop Until A > B
  If A < 0 Then Exit Do
Loop