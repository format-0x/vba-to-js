Dim A As String * 30, B As Integer, C As Integer
Dim D As Boolean

' line if
If A > 0 Then A = "test"
If A < 0 Then A = "test" Else A = ""

' block if
If A > 0 Then
  A = "test"
End If

' nested block if
If A > 0 Then
  If B > 0 Then B = 0
ElseIf A < 0 Then
  If B < 0 Then
    B = 3
  ElseIf B and 0 Then
    B = 2
  Else
    If B or A Then
      A = 0
    End If
  End If
Else
  If B > 0 Then B = 0 Else A = ""
End If