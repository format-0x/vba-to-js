Dim A As Integer, B As Integer

Function Identity(Val As Variant)
  Identity = Val
End Function

For A = 1 To 10 Step 2
  For B = 1 To 10
    Call Identity(A)
  Next B

  If A < 0 Then Exit For
Next A
