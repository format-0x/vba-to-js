Function test(A As Integer = 0, B)
  Private C
  If B Then Exit Function Else C = A * A
End Function

test(3 * 10, 0)
Call test(3 * 10, 0)