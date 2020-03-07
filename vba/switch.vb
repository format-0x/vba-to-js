Dim A As Integer, B As Integer
A = Random() : B = Random()

Select Case A
  Case A < 0, A > 10
    A = 0
  Case B < A, B > A
    B = 0
  Case Else
    B = A
End Select
