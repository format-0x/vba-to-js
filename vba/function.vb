Function Identity(Val As Variant)
  Identity = Val
End Function

Function Factorial(N As Integer)
  If N > 1 Then Factorial = N * Factorial(N - 1) Else Factorial = N
End Function

Factorial(Identity(3))
Call Factorial(_
13)