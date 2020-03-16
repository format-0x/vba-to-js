Dim O$

Friend Function Identity(ByRef Val As Variant)
  Identity = Val
End Function

Static Function Concat(A As String * 30, B As String, Optional C As String * 30 = "") As String
  Concat = A & B & C
End Function

Private Function Factorial(ByVal N As Integer)
  If N > 1 Then Factorial = N * Factorial(N - 1) Else Factorial = N
End Function

Factorial(Identity(3))
Factorial Identity(3)
Factorial 3
Call Factorial(_
13)

O = Concat("Test",,C:="Test")