Dim A As Integer, B As Integer

A = 0 : B = 10

Function Identity(Val As Variant)
  Identity = Val
End Function

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
    If A Mod 2 Then Call Identity(A) Else Exit Do
    A = A + 1
  Loop Until A > B
  If A < 0 Then Exit Do
Loop

' wend
While A < B
  If A Mod 2 Then Call Identity(A) Else Exit Do
  A = A + 1
  While A Mod 2
    A = A + 1
  Wend
Wend