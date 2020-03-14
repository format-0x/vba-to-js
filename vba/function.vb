Dim O$

Function Identity(Val As Variant)
  Identity = Val
End Function

Function Concat(A As String, B As String, C As String)
  Concat = A & B & C
End Function

Function Factorial(N As Integer)
  If N > 1 Then Factorial = N * Factorial(N - 1) Else Factorial = N
End Function

Factorial(Identity(3))
Factorial Identity(3)
Factorial 3
Call Factorial(_
13)

O = Concat("Test",,C:="Test")